use axum::{Json};
use hyper::StatusCode;
use serde::Deserialize;
use rusqlite::{self, params, Connection, Result};
use argon2::{password_hash::{self, rand_core::OsRng, PasswordHash, PasswordHasher, SaltString, PasswordVerifier}, Argon2};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

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

//
// ✅ DB 함수들
//

// 회원가입: DB에 사용자 추가
fn signup_db(conn: &Connection, userid: &str, password_plain: &str) -> Result<(), UserError> {
    let hashed = match argon2_hash(password_plain) {
        Ok(hash) => hash,
        Err(e) => return Err(UserError::PasswordHash(e)),
    };
    
    if let Err(e) = conn.execute(
        "INSERT INTO users (login_id, password_hash) VALUES (?1, ?2)",
        params![userid, hashed],
    ) {return Err(UserError::Database(e));}

    Ok(())
}

// 로그인: 비밀번호 검증
fn login_db(conn: &Connection, login_id: &str, password_plain: &str) -> Result<bool> {
    let mut stmt = conn.prepare("SELECT password_hash FROM users WHERE login_id = ?1")?;
    let stored_hash: String = stmt.query_row([login_id], |row| row.get(0))?;
    Ok(verify_argon2(password_plain, &stored_hash).unwrap_or(false))
}

//
// ✅ API용 구조체
//
#[derive(Deserialize, ToSchema)]
struct SignupForm {
    login_id: String,
    password: String,
}

#[derive(Deserialize, ToSchema)]
struct LoginForm {
    login_id: String,
    password: String,
}

//
// ✅ API 핸들러
//

#[utoipa::path(
    post, // HTTP 메소드
    path = "/api/signup", // 경로
    request_body = SignupForm, // 요청 본문으로 사용할 스키마
    responses(
        // 예상되는 응답들
        (status = 200, description = "유저 생성 성공"),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "로그인 오류"),
    )
)]
async fn signup(Json(form): Json<SignupForm>) -> StatusCode {
    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("❌ 회원가입 실패: {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR;
        }
    };

    // users 테이블 없으면 생성
    if let Err(e) = conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE NOT NULL,
            rating INTEGER DEFAULT 1500
        )",
        [],
    ) {
        eprintln!("❌ 회원가입 실패: 존재하는 아이디 {}", e);
        return StatusCode::BAD_REQUEST;
    };

    match signup_db(&conn, &form.login_id, &form.password) {
        Ok(_) => {
            println!("로그인 성공");
            StatusCode::OK
        }
        Err(e) => {
            match e {
                UserError::PasswordHash(e) => {
                    eprintln!("❌ 회원가입 실패: 비밀 번호 생성 실패 {}", e);
                    StatusCode::INTERNAL_SERVER_ERROR
                }

                UserError::Database(e) => {
                    eprintln!("❌ 회원가입 실패: 중복 유저 {}", e);
                    StatusCode::BAD_REQUEST
                }
            }
        }
    }
}


#[utoipa::path(
    post, // HTTP 메소드
    path = "/api/login", // 경로
    request_body = LoginForm, // 요청 본문으로 사용할 스키마
    responses(
        // 예상되는 응답들
        (status = 200, description = "유저 생성 성공"),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "로그인 오류"),
    )
)]
async fn login(Json(form): Json<LoginForm>) -> StatusCode {
    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("⚠️ 로그인 에러: {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR;
        }
    };

    match login_db(&conn, &form.login_id, &form.password) {
        Ok(true) => {
            println!("로그인 성공");
            StatusCode::OK
        }
        Ok(false) => {
            println!("비밀번호 틀림");
            StatusCode::BAD_REQUEST
        }
        Err(e) => {
            eprintln!("⚠️ 로그인 에러: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR
        }
    }
}

pub fn login_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(signup))
        .routes(routes!(login))
}

/* 기존 코드
let listener = TcpListener::bind("127.0.0.1:3000").await.unwrap();
println!("🚀 서버 실행중: http://127.0.0.1:3000");

serve(listener, app).await.unwrap();
Router::new()
    .fallback_service(ServeDir::new("static")) // static/ 폴더에서 HTML, CSS 제공
*/