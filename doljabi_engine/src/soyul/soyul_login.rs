use axum::{extract::State, Json, http::StatusCode};
use serde::{Deserialize, Serialize};
#[cfg(debug_assertions)]
use serde_json;
use rusqlite::{self, params, Connection};
use argon2::{
    password_hash::{
        self, rand_core::OsRng, PasswordHash, PasswordHasher, PasswordVerifier, SaltString,
    },
    Argon2,
};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::soyul::session::{get_user_id_by_session, generate_session_key, insert_session, SessionStore};

//
// 공통 에러 타입
//
enum UserError {
    PasswordHash(password_hash::Error),
    Database(rusqlite::Error),
}

//
// Argon2 유틸 함수
//
fn argon2_hash(input: &str) -> std::result::Result<String, password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let algorithm = Argon2::default();

    Ok(algorithm.hash_password(input.as_bytes(), &salt)?.to_string())
}

fn verify_argon2(input: &str, hashed: &str) -> std::result::Result<bool, password_hash::Error> {
    let algorithm = Argon2::default();
    let password_hash = PasswordHash::new(&hashed)?;

    Ok(algorithm
        .verify_password(input.as_bytes(), &password_hash)
        .is_ok())
}

//
// DB 함수들
//
#[derive(Serialize, ToSchema, Debug)]
pub struct UserProfile {
    pub username: Option<String>, // NULL 가능성 있으니까 Option
    pub rating: i32,
    // 나중에 필드 더 추가 가능 (예: created_at, bio 등)
}
impl UserProfile {
    pub fn convert_session2proto(self) -> crate::proto::badukboardproto::UserInfo {
        crate::proto::badukboardproto::UserInfo {
            user_name: match self.username {
                Some(name) => name,
                None => "".to_string(),
            },
            rating: self.rating as u32
        }
    }
}

/// user_id로 유저 프로필 가져오기
pub fn get_user_profile_by_id(
    conn: &Connection,
    user_id: u64,
) -> rusqlite::Result<Option<UserProfile>> {
    let mut stmt = conn.prepare(
        "SELECT username, rating
         FROM users
         WHERE id = ?1",
    )?;

    let result = stmt.query_row([user_id as i64], |row| {
        Ok(UserProfile {
            username: row.get(0)?,
            rating: row.get(1)?,
        })
    });

    match result {
        Ok(profile) => Ok(Some(profile)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

/// 회원가입: DB에 사용자 추가 + 생성된 user_id 리턴
fn signup_db(
    conn: &Connection,
    login_id: &str,
    password_plain: &str,
    username: &str,
) -> std::result::Result<u64, UserError> {
    let hashed = match argon2_hash(password_plain) {
        Ok(hash) => hash,
        Err(e) => return Err(UserError::PasswordHash(e)),
    };

    if let Err(e) = conn.execute(
        "INSERT INTO users (login_id, password_hash, username) VALUES (?1, ?2, ?3)",
        params![login_id, hashed, username],
    ) {
        return Err(UserError::Database(e));
    }

    // 방금 INSERT된 행의 rowid = user_id (고유번호)
    let user_id = conn.last_insert_rowid() as u64;
    Ok(user_id)
}

/// 로그인: 비밀번호 검증 + 성공 시 user_id 리턴
fn login_db(
    conn: &Connection,
    login_id: &str,
    password_plain: &str,
) -> std::result::Result<Option<u64>, rusqlite::Error> {
    let mut stmt = conn.prepare("SELECT id, password_hash FROM users WHERE login_id = ?1")?;

    let row = stmt.query_row([login_id], |row| {
        let id: u64 = row.get(0)?;
        let hash: String = row.get(1)?;
        Ok((id, hash))
    });

    match row {
        Ok((user_id, stored_hash)) => {
            let ok = verify_argon2(password_plain, &stored_hash).unwrap_or(false);
            if ok {
                Ok(Some(user_id))
            } else {
                Ok(None)
            }
        }
        // 해당 login_id 없음
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

//
// OpenAPI용 요청/응답 구조체
//
#[derive(Deserialize, ToSchema)]
pub struct SignupForm {
    /// 로그인에 사용할 아이디
    pub login_id: String,
    /// 평문 비밀번호
    pub password: String,
    /// 사용자 이름 (닉네임)
    pub username: String,
}

#[derive(Deserialize, ToSchema)]
pub struct LoginForm {
    /// 로그인에 사용할 아이디
    pub login_id: String,
    /// 평문 비밀번호
    pub password: String,
}

#[derive(Serialize, ToSchema)]
pub struct ApiResponse {
    pub success: bool,
    pub message: String,
}

// 🔹 로그인 응답: 세션키 포함
#[derive(Serialize, ToSchema)]
pub struct LoginResponse {
    pub success: bool,
    pub message: String,
    pub session_key: Option<String>,
}

// 🔹 세션 체크용 요청/응답 (세션키 → user_id 확인)
#[derive(Deserialize, ToSchema)]
pub struct SessionCheckForm {
    pub session_key: String,
}

#[derive(Serialize, ToSchema)]
pub struct UserProfileResponse {
    pub success: bool,
    pub message: String,
    pub user: Option<UserProfile>,
}

//
// API 핸들러
//
#[utoipa::path(
    post,
    path = "/api/signup",
    tag = "auth",
    request_body = SignupForm,
    responses(
        (status = 201, description = "유저 생성 성공", body = ApiResponse),
        (status = 400, description = "이미 존재하는 아이디 또는 잘못된 요청", body = ApiResponse),
        (status = 500, description = "서버 내부 오류", body = ApiResponse),
    )
)]
pub async fn signup(Json(form): Json<SignupForm>) -> (StatusCode, Json<ApiResponse>) {
    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("❌ 회원가입 실패(파일/DB 오픈 에러): {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "데이터베이스 연결 오류".into(),
                }),
            );
        }
    };

    // users 테이블 없으면 생성
    if let Err(e) = conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE,
            rating INTEGER DEFAULT 1500
        )",
        [],
    ) {
        eprintln!("❌ 테이블 생성 실패: {}", e);
        return (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(ApiResponse {
                success: false,
                message: "테이블 생성 실패".into(),
            }),
        );
    };

    match signup_db(&conn, &form.login_id, &form.password, &form.username) {
        Ok(user_id) => {
            println!("✅ 회원가입 성공, user_id = {}", user_id);
            (
                StatusCode::CREATED,
                Json(ApiResponse {
                    success: true,
                    // 발표용/디버그용으로 user_id까지 메시지에 포함
                    message: format!("회원가입 성공 (user_id = {})", user_id),
                }),
            )
        }
        Err(UserError::PasswordHash(e)) => {
            eprintln!("❌ 비밀번호 해시 실패: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "비밀번호 해시 실패".into(),
                }),
            )
        }
        Err(UserError::Database(e)) => {
            eprintln!("❌ 회원가입 실패(중복 등): {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse {
                    success: false,
                    message: "이미 존재하는 아이디이거나 잘못된 요청입니다.".into(),
                }),
            )
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/login",
    tag = "auth",
    request_body = LoginForm,
    responses(
        (status = 200, description = "로그인 성공", body = LoginResponse),
        (status = 400, description = "아이디 또는 비밀번호가 틀림", body = LoginResponse),
        (status = 500, description = "서버 내부 오류", body = LoginResponse),
    )
)]
pub async fn login(
    State(session_store): State<SessionStore>,
    Json(form): Json<LoginForm>,
) -> (StatusCode, Json<LoginResponse>) {
    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("⚠️ 로그인 에러(DB 오픈 실패): {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(LoginResponse {
                    success: false,
                    message: "데이터베이스 연결 오류".into(),
                    session_key: None,
                }),
            );
        }
    };

    match login_db(&conn, &form.login_id, &form.password) {
        // 🔹 로그인 성공 + user_id 확보
        Ok(Some(user_id)) => {
            println!("✅ 로그인 성공, user_id = {}", user_id);

            // 1) 세션키 생성
            let session_key = generate_session_key();

            // 2) 서버 메모리 SessionStore에 (세션키 -> user_id) 저장
            insert_session(&session_store, session_key.clone(), user_id).await;

            // 3) 응답 JSON 생성
            let resp = LoginResponse {
                success: true,
                message: "로그인 성공".into(),
                session_key: Some(session_key),
            };

            // 🔍 디버깅: 응답 JSON을 문자열로 찍기
            #[cfg(debug_assertions)]
            let json_str = serde_json::to_string(&resp).unwrap();
            #[cfg(debug_assertions)]
            println!("[DEBUG] login response JSON = {}", json_str);

            (StatusCode::OK, Json(resp))
        }
        // 아이디 없음 or 비밀번호 틀림
        Ok(None) => {
            println!("❌ 로그인 실패: 아이디 또는 비밀번호 틀림");
            let resp = LoginResponse {
                success: false,
                message: "아이디 또는 비밀번호가 올바르지 않습니다.".into(),
                session_key: None,
            };
            #[cfg(debug_assertions)]
            let json_str = serde_json::to_string(&resp).unwrap();
            #[cfg(debug_assertions)]
            println!("[DEBUG] login response JSON = {}", json_str);

            (StatusCode::BAD_REQUEST, Json(resp))
        }
        Err(e) => {
            eprintln!("⚠️ 로그인 에러: {}", e);
            let resp = LoginResponse {
                success: false,
                message: "로그인 처리 중 오류가 발생했습니다.".into(),
                session_key: None,
            };
            #[cfg(debug_assertions)]
            let json_str = serde_json::to_string(&resp).unwrap();
            #[cfg(debug_assertions)]
            println!("[DEBUG] login response JSON = {}", json_str);

            (StatusCode::INTERNAL_SERVER_ERROR, Json(resp))
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/session_check",
    tag = "auth",
    request_body = SessionCheckForm,
    responses(
        (status = 200, description = "세션 존재 여부 확인"),
        (status = 400, description = "세션 키가 올바르지 않음"),
    )
)]
pub async fn session_check(
    State(session_store): State<SessionStore>,
    Json(form): Json<SessionCheckForm>,
) -> StatusCode {
    let user_id_opt = get_user_id_by_session(&session_store, &form.session_key).await;

    // 🔍 디버깅: 세션키 → user_id 매핑 출력
    #[cfg(debug_assertions)]
    match user_id_opt {
        Some(uid) => println!(
            "[DEBUG] session_check: key(prefix) = {}, user_id = {}",
            &form.session_key[..16.min(form.session_key.len())],
            uid
        ),
        None => println!(
            "[DEBUG] session_check: key(prefix) = {}, NOT FOUND",
            &form.session_key[..16.min(form.session_key.len())],
        ),
    };

    if user_id_opt.is_some() {
        StatusCode::OK
    } else {
        StatusCode::BAD_REQUEST
    }
}

#[utoipa::path(
    post,
    path = "/api/user/profile",
    tag = "user",
    request_body = SessionCheckForm,
    responses(
        (status = 200, description = "유저 정보 조회 성공", body = UserProfileResponse),
        (status = 404, description = "해당 유저 없음", body = UserProfileResponse),
        (status = 500, description = "서버 내부 오류", body = UserProfileResponse),
    )
)]
pub async fn get_user_profile_handler(
    State(session_store): State<SessionStore>,
    Json(form): Json<SessionCheckForm>,
) -> (StatusCode, Json<UserProfileResponse>) {
    let user_id_opt = get_user_id_by_session(&session_store, &form.session_key).await;

    if user_id_opt.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(UserProfileResponse {
                success: false,
                message: "세션 키가 올바르지 않습니다.".into(),
                user: None,
            }),
        );
    }

    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("⚠️ 유저 정보 조회(DB 오픈 실패): {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(UserProfileResponse {
                    success: false,
                    message: "데이터베이스 연결 오류".into(),
                    user: None,
                }),
            );
        }
    };

    match get_user_profile_by_id(&conn, user_id_opt.unwrap()) {
        Ok(Some(profile)) => {
            println!("✅ 유저 정보 조회 성공: {:?}", profile);
            (
                StatusCode::OK,
                Json(UserProfileResponse {
                    success: true,
                    message: "유저 정보 조회 성공".into(),
                    user: Some(profile),
                }),
            )
        }
        Ok(None) => {
            eprintln!("❌ 유저 정보 없음");
            (
                StatusCode::NOT_FOUND,
                Json(UserProfileResponse {
                    success: false,
                    message: "해당 유저를 찾을 수 없습니다.".into(),
                    user: None,
                }),
            )
        }
        Err(e) => {
            eprintln!("⚠️ 유저 정보 조회 중 에러: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(UserProfileResponse {
                    success: false,
                    message: "유저 정보 조회 중 오류가 발생했습니다.".into(),
                    user: None,
                }),
            )
        }
    }
}

// 🔹 닉네임 변경 요청
#[derive(Deserialize, ToSchema)]
pub struct UpdateUsernameForm {
    pub session_key: String,
    pub new_username: String,
}

// 🔹 비밀번호 변경 요청
#[derive(Deserialize, ToSchema)]
pub struct UpdatePasswordForm {
    pub session_key: String,
    pub current_password: String,
    pub new_password: String,
}

#[utoipa::path(
    post,
    path = "/api/user/update-username",
    tag = "user",
    request_body = UpdateUsernameForm,
    responses(
        (status = 200, description = "닉네임 변경 성공", body = ApiResponse),
        (status = 400, description = "잘못된 요청 또는 이미 사용 중인 닉네임", body = ApiResponse),
        (status = 500, description = "서버 내부 오류", body = ApiResponse),
    )
)]
pub async fn update_username(
    State(session_store): State<SessionStore>,
    Json(form): Json<UpdateUsernameForm>,
) -> (StatusCode, Json<ApiResponse>) {
    let user_id_opt = get_user_id_by_session(&session_store, &form.session_key).await;

    if user_id_opt.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                message: "세션 키가 올바르지 않습니다.".into(),
            }),
        );
    }

    let user_id = user_id_opt.unwrap();

    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("❌ DB 오픈 실패: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "데이터베이스 연결 오류".into(),
                }),
            );
        }
    };

    match conn.execute(
        "UPDATE users SET username = ?1 WHERE id = ?2",
        params![form.new_username, user_id as i64],
    ) {
        Ok(_) => {
            println!("✅ 닉네임 변경 성공: user_id={}, new_username={}", user_id, form.new_username);
            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    message: "닉네임이 변경되었습니다.".into(),
                }),
            )
        }
        Err(e) => {
            eprintln!("❌ 닉네임 변경 실패: {}", e);
            (
                StatusCode::BAD_REQUEST,
                Json(ApiResponse {
                    success: false,
                    message: "닉네임 변경 실패 (이미 사용 중일 수 있습니다)".into(),
                }),
            )
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/user/update-password",
    tag = "user",
    request_body = UpdatePasswordForm,
    responses(
        (status = 200, description = "비밀번호 변경 성공", body = ApiResponse),
        (status = 400, description = "현재 비밀번호가 올바르지 않음", body = ApiResponse),
        (status = 500, description = "서버 내부 오류", body = ApiResponse),
    )
)]
pub async fn update_password(
    State(session_store): State<SessionStore>,
    Json(form): Json<UpdatePasswordForm>,
) -> (StatusCode, Json<ApiResponse>) {
    let user_id_opt = get_user_id_by_session(&session_store, &form.session_key).await;

    if user_id_opt.is_none() {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                message: "세션 키가 올바르지 않습니다.".into(),
            }),
        );
    }

    let user_id = user_id_opt.unwrap();

    let conn = match Connection::open("mydb.db") {
        Ok(conn) => conn,
        Err(e) => {
            eprintln!("❌ DB 오픈 실패: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "데이터베이스 연결 오류".into(),
                }),
            );
        }
    };

    // 현재 비밀번호 확인
    let mut stmt = match conn.prepare("SELECT password_hash FROM users WHERE id = ?1") {
        Ok(stmt) => stmt,
        Err(e) => {
            eprintln!("❌ 쿼리 준비 실패: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "서버 오류".into(),
                }),
            );
        }
    };

    let stored_hash: String = match stmt.query_row([user_id as i64], |row| row.get(0)) {
        Ok(hash) => hash,
        Err(e) => {
            eprintln!("❌ 유저 조회 실패: {}", e);
            return (
                StatusCode::NOT_FOUND,
                Json(ApiResponse {
                    success: false,
                    message: "유저를 찾을 수 없습니다.".into(),
                }),
            );
        }
    };

    // 현재 비밀번호 검증
    let is_valid = verify_argon2(&form.current_password, &stored_hash).unwrap_or(false);
    if !is_valid {
        return (
            StatusCode::BAD_REQUEST,
            Json(ApiResponse {
                success: false,
                message: "현재 비밀번호가 올바르지 않습니다.".into(),
            }),
        );
    }

    // 새 비밀번호 해싱
    let new_hash = match argon2_hash(&form.new_password) {
        Ok(hash) => hash,
        Err(e) => {
            eprintln!("❌ 비밀번호 해싱 실패: {}", e);
            return (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "비밀번호 처리 오류".into(),
                }),
            );
        }
    };

    // 비밀번호 업데이트
    match conn.execute(
        "UPDATE users SET password_hash = ?1 WHERE id = ?2",
        params![new_hash, user_id as i64],
    ) {
        Ok(_) => {
            println!("✅ 비밀번호 변경 성공: user_id={}", user_id);
            (
                StatusCode::OK,
                Json(ApiResponse {
                    success: true,
                    message: "비밀번호가 변경되었습니다.".into(),
                }),
            )
        }
        Err(e) => {
            eprintln!("❌ 비밀번호 변경 실패: {}", e);
            (
                StatusCode::INTERNAL_SERVER_ERROR,
                Json(ApiResponse {
                    success: false,
                    message: "비밀번호 변경 실패".into(),
                }),
            )
        }
    }
}

pub fn login_router() -> OpenApiRouter<SessionStore> {
    OpenApiRouter::new()
        .routes(routes!(signup))
        .routes(routes!(login))
        .routes(routes!(session_check))
        .routes(routes!(get_user_profile_handler))
        .routes(routes!(update_username))
        .routes(routes!(update_password))
}
