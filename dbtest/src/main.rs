use axum::{
    Router,
    routing::{get, post},
    Form,
    response::Html,
    extract::State,
};
use serde::{Deserialize, Serialize};
use rusqlite::{params, Connection, Result};
use bcrypt::{hash, verify, DEFAULT_COST};
use tower_http::services::ServeDir;

// 🔒 세션 관련
use axum_sessions::{
    async_session::MemoryStore,
    extractors::WritableSession,
    SessionLayer,
};
use tower_cookies::CookieManagerLayer;
use std::{env, time::Duration, net::SocketAddr};

// base64 최신 API (경고 제거)
use base64::{engine::general_purpose, Engine as _};

#[derive(Clone)]
struct AppState {
    db_path: String,
}

// ─────────────────────────────
// ✅ 세션/만료 정책 (std::time::Duration 사용)
// ─────────────────────────────
const ABS_TTL: Duration      = Duration::from_secs(60 * 60 * 24 * 7); // 7일
const IDLE_TTL: Duration     = Duration::from_secs(60 * 30);         // 30분
const RENEW_BEFORE: Duration = Duration::from_secs(60 * 5);          // 5분
// (지금 코드는 간단 버전이라 IDLE_TTL/RENEW_BEFORE 미사용. 확장 시 touch 로직에 활용)


// ─────────────────────────────
// ✅ DB 유틸
// ─────────────────────────────
fn ensure_schema(conn: &Connection) {
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
}

fn signup_db(conn: &Connection, username: &str, password_plain: &str) -> Result<()> {
    let hashed = hash(password_plain, DEFAULT_COST).expect("bcrypt hash 실패");
    conn.execute(
        "INSERT INTO users (username, password_hash) VALUES (?1, ?2)",
        params![username, hashed],
    )?;
    Ok(())
}

fn login_db(conn: &Connection, username: &str, password_plain: &str) -> Result<bool> {
    let mut stmt = conn.prepare("SELECT password_hash FROM users WHERE username = ?1")?;
    let stored_hash: String = stmt.query_row([username], |row| row.get(0))?;
    Ok(verify(password_plain, &stored_hash).unwrap_or(false))
}

// ─────────────────────────────
// ✅ Form 데이터
// ─────────────────────────────
#[derive(Deserialize)]
struct SignupForm { username: String, password: String }
#[derive(Deserialize)]
struct LoginForm  { username: String, password: String }

#[derive(Serialize)]
struct ApiRes<T> { ok: bool, data: Option<T>, message: Option<String> }
#[derive(Serialize)]
struct UserInfo { id: i64, username: String }

// ─────────────────────────────
// ✅ 라우트 핸들러
// ─────────────────────────────
async fn index() -> Html<&'static str> {
    Html(r#"
        <html>
        <head><title>바둑/오목 사이트</title></head>
        <body style="text-align:center; font-family:sans-serif;">
            <h1>바둑/오목 웹사이트 🎮</h1>
            <p><a href="/signup.html">회원가입</a> | <a href="/login.html">로그인</a> | <a href="/game.html">게임하기</a></p>
        </body>
        </html>
    "#)
}
#[axum::debug_handler]
async fn signup(State(state): State<AppState>, Form(form): Form<SignupForm>) -> Html<String> {
    let conn = Connection::open(&state.db_path).unwrap();
    ensure_schema(&conn);

    match signup_db(&conn, &form.username, &form.password) {
        Ok(_) => {
            println!("✅ 회원가입 성공: {}", form.username);
            Html(format!(
                "<script>alert('회원가입 성공: {}'); window.location.href='/login.html';</script>",
                form.username
            ))
        }
        Err(e) => {
            println!("❌ 회원가입 실패: {}", e);
            Html("<script>alert('회원가입 실패: 이미 존재하는 아이디입니다.'); history.back();</script>".to_string())
        }
    }
}

#[axum::debug_handler]
async fn login(
    State(state): State<AppState>,
    mut session: WritableSession,
    Form(form): Form<LoginForm>,
) -> Html<String> {
    let conn = Connection::open(&state.db_path).unwrap();
    ensure_schema(&conn);

    match login_db(&conn, &form.username, &form.password) {
        Ok(true) => {
            println!("✅ 로그인 성공: {}", form.username);
            session.destroy();
            session.insert("username", &form.username).unwrap();
            session.insert("last_seen", chrono::Utc::now().timestamp()).unwrap();

            Html(format!(
                "<script>alert('{}님 환영합니다!'); window.location.href='/game.html';</script>",
                form.username
            ))
        }
        Ok(false) => {
            println!("❌ 로그인 실패 (비밀번호 틀림): {}", form.username);
            Html("<script>alert('로그인 실패: 비밀번호가 틀렸습니다.'); history.back();</script>".to_string())
        }
        Err(e) => {
            println!("⚠️ 로그인 DB 에러: {}", e);
            Html("<script>alert('DB 오류 발생'); history.back();</script>".to_string())
        }
    }
}


async fn me(session: WritableSession) -> Html<String> {
    let username: Option<String> = session.get("username");
    if let Some(name) = username {
        Html(format!("<script>alert('세션 유지중: {}'); history.back();</script>", name))
    } else {
        Html("<script>alert('로그인 필요'); window.location.href='/login.html';</script>".to_string())
    }
}

async fn logout(mut session: WritableSession) -> Html<String> {
    session.destroy();
    Html("<script>alert('로그아웃 완료'); window.location.href='/login.html';</script>".to_string())
}

// ─────────────────────────────
// ✅ 서버 실행 (axum 0.6 방식)
// ─────────────────────────────
#[tokio::main]
async fn main() {
    dotenvy::dotenv().ok();

    // 세션 키 읽기 (base64: 최신 API)
    let secret = general_purpose::STANDARD
        .decode(env::var("SESSION_KEY").expect("SESSION_KEY not set"))
        .expect("invalid base64 SESSION_KEY");

    let store = MemoryStore::new();
    let session_layer = SessionLayer::new(store, &secret)
        .with_cookie_name("doljabi.sid")
        .with_session_ttl(Some(ABS_TTL))
        // .with_cookie_http_only(true)   // 이 버전에선 없음(기본적으로 HttpOnly)
        .with_same_site_policy(axum_sessions::SameSite::Lax);
        // .with_cookie_secure(true) // HTTPS면 켜기

    let state = AppState { db_path: "mydb.db".into() };

    let app = Router::new()
        .route("/", get(index))
        .route("/signup", post(signup))
        .route("/login", post(login))
        .route("/api/auth/me", get(me))
        .route("/api/auth/logout", post(logout))
        .layer(session_layer)
        .layer(CookieManagerLayer::new())
        .with_state(state)
        .fallback_service(ServeDir::new("static"));

    // axum 0.6: Server::bind(...).serve(...)
    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    println!("🚀 서버 실행중: http://{}", addr);
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();
}
