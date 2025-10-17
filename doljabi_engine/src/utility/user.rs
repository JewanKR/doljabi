use axum::{
    Router,
    routing::post,
    Form,       // HTML <form> 데이터 파싱
};
use serde::Deserialize;
use rusqlite::{self, params, Connection, Result};
use tower_http::services::ServeDir;
use argon2::{password_hash::{self, rand_core::OsRng, PasswordHash, PasswordHasher, SaltString, PasswordVerifier}, Argon2};

//
// ✅ DB 함수들
//

enum UserError {
    PasswordHash(password_hash::Error),
    Database(rusqlite::Error),
}

fn argon2_hash(input: &str) -> Result<String, password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let algorithm = Argon2::default();
    
    Ok(algorithm.hash_password(input.as_bytes(), &salt)?.to_string())
}

fn verify_argon2(input: &str, hashed: &str) -> Result<bool, password_hash::Error> {
    let algorithm = Argon2::default();
    let password_hash =  PasswordHash::new(&hashed)?;

    Ok(algorithm.verify_password(input.as_bytes(), &password_hash).is_ok())
}


// 회원가입: DB에 사용자 추가
fn signup_db(conn: &Connection, username: &str, password_plain: &str) -> Result<(), UserError> {
    let hashed = match argon2_hash(password_plain) {
        Ok(hash) => hash,
        Err(e) => return Err(UserError::PasswordHash(e)),
    };
    
    if let Err(e) = conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?1, ?2)",
        params![username, hashed],
    ) {return Err(UserError::Database(e));}

    Ok(())
}

// 로그인: 비밀번호 검증
fn login_db(conn: &Connection, username: &str, password_plain: &str) -> Result<bool> {
    let mut stmt = conn.prepare("SELECT password_hash FROM users WHERE username = ?1")?;
    let stored_hash: String = stmt.query_row([username], |row| row.get(0))?;
    Ok(verify_argon2(password_plain, &stored_hash).unwrap_or(false))
}

//
// ✅ API용 구조체
//
#[derive(Deserialize)]
struct SignupForm {
    username: String,
    password: String,
}

#[derive(Deserialize)]
struct LoginForm {
    username: String,
    password: String,
}

//
// ✅ API 핸들러
//
async fn signup(Form(form): Form<SignupForm>) -> String {
    let signup_error_message = "⚠️ 회원가입 에러: 서버 관리자에게 문의하세요".to_string();

    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("❌ 회원가입 실패: {}", e);
            return signup_error_message;
        }
    };

    // users 테이블 없으면 생성
    if let Err(e) = conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            rating INTEGER DEFAULT 1500,
        )",
        [],
    ) {
        eprintln!("❌ 회원가입 실패: {}", e);
        return signup_error_message;
    };

    match signup_db(&conn, &form.username, &form.password) {
        Ok(_) => {
            println!("✅ 회원가입 성공: {}", form.username);
            format!("회원가입 성공: {}", form.username)
        }
        Err(e) => {
            match e {
                UserError::PasswordHash(e) => {eprintln!("❌ 회원가입 실패: {}", e);}
                UserError::Database(e) => {eprintln!("❌ 회원가입 실패: {}", e);}
            }
            signup_error_message
        }
    }
}

async fn login(Form(form): Form<LoginForm>) -> String {
    let login_error_message = "⚠️ 로그인 에러: 서버 관리자에게 문의하세요".to_string();

    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("⚠️ 로그인 에러: {}", e);
            return login_error_message;
        }
    };

    match login_db(&conn, &form.username, &form.password) {
        Ok(true) => {
            println!("✅ 로그인 성공: {}", form.username);
            format!("{} 로그인 성공!", form.username)
        }
        Ok(false) => {
            println!("❌ 로그인 실패 (비밀번호 틀림): {}", form.username);
            format!("{} 로그인 실패", form.username)
        }
        Err(e) => {
            eprintln!("⚠️ 로그인 에러: {}", e);
            login_error_message
        }
    }
}

pub fn user_router() -> Router {
    Router::new()
        .route("/signup", post(signup))
        .route("/login", post(login))
}

/* 기존 코드
let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
println!("🚀 서버 실행중: http://127.0.0.1:3000");

serve(listener, app).await.unwrap();
Router::new()
    .fallback_service(ServeDir::new("static")) // static/ 폴더에서 HTML, CSS 제공
*/