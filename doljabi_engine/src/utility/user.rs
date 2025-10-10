use axum::{
    Router,
    routing::post,
    Form,       // HTML <form> 데이터 파싱
};
use serde::Deserialize;
use rusqlite::{params, Connection, Result};
use bcrypt::{hash, verify, DEFAULT_COST};
use tower_http::services::ServeDir;

//
// ✅ DB 함수들
//

// 회원가입: DB에 사용자 추가
fn signup_db(conn: &Connection, username: &str, password_plain: &str) -> Result<()> {
    let hashed = hash(password_plain, DEFAULT_COST).expect("bcrypt hash 실패");
    conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?1, ?2)",
        params![username, hashed],
    )?;
    Ok(())
}

// 로그인: 비밀번호 검증
fn login_db(conn: &Connection, username: &str, password_plain: &str) -> Result<bool> {
    let mut stmt = conn.prepare("SELECT password_hash FROM users WHERE username = ?1")?;
    let stored_hash: String = stmt.query_row([username], |row| row.get(0))?;
    Ok(verify(password_plain, &stored_hash).unwrap_or(false))
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
    let conn = Connection::open("mydb.db").unwrap();

    // users 테이블 없으면 생성
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            rating INTEGER DEFAULT 1000,
            win INTEGER DEFAULT 0,
            lose INTEGER DEFAULT 0
        )",
        [],
    ).unwrap();

    match signup_db(&conn, &form.username, &form.password) {
        Ok(_) => {
            println!("✅ 회원가입 성공: {}", form.username);
            format!("회원가입 성공: {}", form.username)
        }
        Err(e) => {
            println!("❌ 회원가입 실패: {}", e);
            format!("회원가입 실패: {}", e)
        }
    }
}

async fn login(Form(form): Form<LoginForm>) -> String {
    let conn = Connection::open("mydb.db").unwrap();

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
            println!("⚠️ 로그인 DB 에러: {}", e);
            format!("DB 에러: {}", e)
        }
    }
}

pub fn user_router() -> Router {
    Router::new()
        .route("/signup", post(signup))   // POST /signup
        .route("/login", post(login))     // POST /login
        .fallback_service(ServeDir::new("static")) // static/ 폴더에서 HTML, CSS 제공
}

/*
let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
println!("🚀 서버 실행중: http://127.0.0.1:3000");

serve(listener, app).await.unwrap();
*/