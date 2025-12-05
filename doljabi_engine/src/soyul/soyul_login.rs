use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use rusqlite::{params, Connection, Error as SqlError};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use base64::{engine::general_purpose, Engine as _};

use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{
    SaltString,
    PasswordHash,
    PasswordVerifier,
    rand_core::{OsRng, RngCore},
};

// 세션 스토어 (이미 crate 안에 있음)
use crate::soyul::session::SessionStore;

/// DB 커넥션 타입 (SQLite)
pub type Db = Arc<Mutex<Connection>>;

/// 관리자용 상태(State)
#[derive(Clone)]
pub struct AdminState {
    pub db: Db,
}

/// 로그인용 상태(State)
#[derive(Clone)]
pub struct LoginState {
    pub db: Db,
    pub sessions: SessionStore,
}

/// 공통 응답 형태
#[derive(Serialize, ToSchema)]
pub struct GenericResponse {
    pub success: bool,
    pub message: String,
}

/// 닉네임 변경 요청 바디
#[derive(Deserialize, ToSchema)]
pub struct UpdateNicknameRequest {
    pub new_username: String,
}

/// 비밀번호 변경 요청 바디
#[derive(Deserialize, ToSchema)]
pub struct UpdatePasswordRequest {
    pub new_password: String,
}

/// 밴 상태 변경 요청 바디
#[derive(Deserialize, ToSchema)]
pub struct UpdateBanRequest {
    pub is_banned: bool,
}

/// 내부 에러 헬퍼
fn internal_error<E: std::fmt::Display>(err: E) -> (StatusCode, Json<GenericResponse>) {
    (
        StatusCode::INTERNAL_SERVER_ERROR,
        Json(GenericResponse {
            success: false,
            message: format!("서버 내부 오류: {err}"),
        }),
    )
}

/// Argon2로 비밀번호 해시
fn hash_password(password: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hashed = argon2.hash_password(password.as_bytes(), &salt)?;
    Ok(hashed.to_string())
}

// ============================================================
// 1) 관리자용 API
// ============================================================

//
// 1) 닉네임(username) 변경
//
#[utoipa::path(
    patch,
    path = "/admin/users/{user_id}/username",
    params(
        ("user_id" = i64, Path, description = "유저 ID")
    ),
    request_body = UpdateNicknameRequest,
    responses(
        (status = 200, description = "닉네임 변경 성공", body = GenericResponse),
        (status = 400, description = "잘못된 요청", body = GenericResponse),
        (status = 404, description = "유저를 찾을 수 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn update_username(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
    Json(body): Json<UpdateNicknameRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let affected = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        conn.execute(
            "UPDATE users SET username = ?1 WHERE id = ?2",
            params![body.new_username, user_id],
        )
        .map_err(internal_error)?
    };

    if affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 유저를 찾을 수 없습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: "닉네임이 변경되었습니다.".to_string(),
    }))
}

//
// 2) 비밀번호 변경
//
#[utoipa::path(
    patch,
    path = "/admin/users/{user_id}/password",
    params(
        ("user_id" = i64, Path, description = "유저 ID")
    ),
    request_body = UpdatePasswordRequest,
    responses(
        (status = 200, description = "비밀번호 변경 성공", body = GenericResponse),
        (status = 404, description = "유저를 찾을 수 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn update_password(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
    Json(body): Json<UpdatePasswordRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let hashed = hash_password(&body.new_password).map_err(internal_error)?;

    let affected = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        conn.execute(
            "UPDATE users SET password_hash = ?1 WHERE id = ?2",
            params![hashed, user_id],
        )
        .map_err(internal_error)?
    };

    if affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 유저가 존재하지 않습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: "비밀번호가 변경되었습니다.".to_string(),
    }))
}

//
// 3) 계정 밴 설정 / 해제
//
#[utoipa::path(
    patch,
    path = "/admin/users/{user_id}/ban",
    params(
        ("user_id" = i64, Path, description = "유저 ID")
    ),
    request_body = UpdateBanRequest,
    responses(
        (status = 200, description = "밴 상태 변경 성공", body = GenericResponse),
        (status = 404, description = "유저를 찾을 수 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn update_ban_status(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
    Json(body): Json<UpdateBanRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let banned_int = if body.is_banned { 1 } else { 0 };

    let affected = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        conn.execute(
            "UPDATE users SET is_banned = ?1 WHERE id = ?2",
            params![banned_int, user_id],
        )
        .map_err(internal_error)?
    };

    if affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 유저가 존재하지 않습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: if body.is_banned {
            "계정이 밴 처리되었습니다.".to_string()
        } else {
            "계정의 밴이 해제되었습니다.".to_string()
        },
    }))
}

//
// 4) 계정 삭제
//
#[utoipa::path(
    delete,
    path = "/admin/users/{user_id}",
    params(
        ("user_id" = i64, Path, description = "유저 ID")
    ),
    responses(
        (status = 200, description = "유저 삭제 성공", body = GenericResponse),
        (status = 404, description = "유저를 찾을 수 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn delete_user(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let affected = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        conn.execute("DELETE FROM users WHERE id = ?1", params![user_id])
            .map_err(internal_error)?
    };

    if affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 유저가 존재하지 않습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: "유저가 삭제되었습니다.".to_string(),
    }))
}

//
// 관리자 라우터 묶기
//
pub fn admin_router() -> OpenApiRouter<AdminState> {
    OpenApiRouter::new()
        .routes(routes!(update_username))
        .routes(routes!(update_password))
        .routes(routes!(update_ban_status))
        .routes(routes!(delete_user))
}

// ===================== 세션 헬퍼 함수들 =====================

// 세션 생성: user_id -> session_key
async fn create_session(store: &SessionStore, user_id: i64) -> String {
    // 랜덤 32바이트 생성
    let mut bytes = [0u8; 32];
    OsRng.fill_bytes(&mut bytes);

    // URL-safe 문자열로 인코딩
    let session_key = general_purpose::URL_SAFE_NO_PAD.encode(bytes);

    {
        let mut map = store.write().await;
        map.insert(session_key.clone(), user_id as u64);
    }

    session_key
}

// 세션키로 user_id 조회
async fn get_user_id(store: &SessionStore, session_key: &str) -> Option<i64> {
    let map = store.read().await;
    map.get(session_key).copied().map(|v| v as i64)
}

// 세션 삭제 (로그아웃)
async fn destroy_session(store: &SessionStore, session_key: &str) -> bool {
    let mut map = store.write().await;
    map.remove(session_key).is_some()
}

// ============================================================
// 2) 로그인 / 회원가입 API
// ============================================================

#[derive(Deserialize, ToSchema)]
pub struct SignupRequest {
    pub login_id: String,
    pub password: String,
    pub username: String,
}

#[derive(Deserialize, ToSchema)]
pub struct LoginRequest {
    pub login_id: String,
    pub password: String,
}

#[derive(Deserialize, ToSchema)]
pub struct SessionKeyRequest {
    pub session_key: String,
}

#[derive(Serialize, ToSchema)]
pub struct LoginResult {
    pub success: bool,
    pub message: String,
    pub session_key: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct MeResponse {
    pub user_id: i64,
    pub login_id: String,
    pub username: String,
    pub rating: i32,
    pub is_banned: bool,
}

/// 회원가입
#[utoipa::path(
    post,
    path = "/soyul/auth/signup",
    request_body = SignupRequest,
    responses(
        (status = 200, description = "회원가입 성공", body = GenericResponse),
        (status = 400, description = "이미 존재하는 아이디/닉네임", body = GenericResponse)
    ),
    tag = "auth"
)]
pub async fn signup(
    State(state): State<LoginState>,
    Json(body): Json<SignupRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let hashed = hash_password(&body.password).map_err(internal_error)?;

    let result = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        conn.execute(
            "INSERT INTO users (login_id, password_hash, username) VALUES (?1, ?2, ?3)",
            params![body.login_id, hashed, body.username],
        )
    };

    match result {
        Ok(_) => Ok(Json(GenericResponse {
            success: true,
            message: "회원가입이 완료되었습니다.".to_string(),
        })),
        Err(e) => {
            if let SqlError::SqliteFailure(_, _) = e {
                Err((
                    StatusCode::BAD_REQUEST,
                    Json(GenericResponse {
                        success: false,
                        message: "이미 존재하는 아이디 또는 닉네임입니다.".to_string(),
                    }),
                ))
            } else {
                Err(internal_error(e))
            }
        }
    }
}

/// 로그인
#[utoipa::path(
    post,
    path = "/soyul/auth/login",
    request_body = LoginRequest,
    responses(
        (status = 200, description = "로그인 성공", body = LoginResult),
        (status = 401, description = "로그인 실패", body = LoginResult)
    ),
    tag = "auth"
)]
pub async fn login(
    State(state): State<LoginState>,
    Json(body): Json<LoginRequest>,
) -> Result<Json<LoginResult>, (StatusCode, Json<LoginResult>)> {
    let (user_id, stored_hash, is_banned) = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        let result = conn.query_row(
            "SELECT id, password_hash, COALESCE(is_banned, 0) FROM users WHERE login_id = ?1",
            params![body.login_id],
            |row| {
                Ok((
                    row.get::<_, i64>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i32>(2)?,
                ))
            },
        );

        match result {
            Ok(v) => v,
            Err(SqlError::QueryReturnedNoRows) => {
                return Err((
                    StatusCode::UNAUTHORIZED,
                    Json(LoginResult {
                        success: false,
                        message: "아이디 또는 비밀번호가 올바르지 않습니다.".to_string(),
                        session_key: None,
                    }),
                ));
            }
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(LoginResult {
                        success: false,
                        message: format!("서버 오류: {e}"),
                        session_key: None,
                    }),
                ))
            }
        }
    };

    if is_banned != 0 {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(LoginResult {
                success: false,
                message: "밴 처리된 계정입니다.".to_string(),
                session_key: None,
            }),
        ));
    }

    // 비밀번호 검증
    let parsed_hash = PasswordHash::new(&stored_hash).map_err(|e| {
        (
            StatusCode::INTERNAL_SERVER_ERROR,
            Json(LoginResult {
                success: false,
                message: format!("비밀번호 해시 파싱 오류: {e}"),
                session_key: None,
            }),
        )
    })?;

    if Argon2::default()
        .verify_password(body.password.as_bytes(), &parsed_hash)
        .is_err()
    {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(LoginResult {
                success: false,
                message: "아이디 또는 비밀번호가 올바르지 않습니다.".to_string(),
                session_key: None,
            }),
        ));
    }

    // 세션 생성
    let session_key = create_session(&state.sessions, user_id).await;

    Ok(Json(LoginResult {
        success: true,
        message: "로그인에 성공했습니다.".to_string(),
        session_key: Some(session_key),
    }))
}

/// 세션 키로 내 정보 조회
#[utoipa::path(
    post,
    path = "/soyul/auth/me",
    request_body = SessionKeyRequest,
    responses(
        (status = 200, description = "유저 정보", body = MeResponse),
        (status = 401, description = "세션 없음/만료", body = GenericResponse)
    ),
    tag = "auth"
)]
pub async fn me(
    State(state): State<LoginState>,
    Json(body): Json<SessionKeyRequest>,
) -> Result<Json<MeResponse>, (StatusCode, Json<GenericResponse>)> {
    let Some(user_id) = get_user_id(&state.sessions, &body.session_key).await else {
        return Err((
            StatusCode::UNAUTHORIZED,
            Json(GenericResponse {
                success: false,
                message: "유효하지 않은 세션입니다.".to_string(),
            }),
        ));
    };

    let (login_id, username, rating, is_banned) = {
        let db = state.db.clone();
        let mut conn = db.lock().await;

        let result = conn.query_row(
            "SELECT login_id, username, COALESCE(rating, 1500), COALESCE(is_banned, 0) FROM users WHERE id = ?1",
            params![user_id],
            |row| {
                Ok((
                    row.get::<_, String>(0)?,
                    row.get::<_, String>(1)?,
                    row.get::<_, i32>(2)?,
                    row.get::<_, i32>(3)?,
                ))
            },
        );

        match result {
            Ok(v) => v,
            Err(e) => {
                return Err((
                    StatusCode::INTERNAL_SERVER_ERROR,
                    Json(GenericResponse {
                        success: false,
                        message: format!("DB 오류: {e}"),
                    }),
                ))
            }
        }
    };

    Ok(Json(MeResponse {
        user_id,
        login_id,
        username,
        rating,
        is_banned: is_banned != 0,
    }))
}

/// 로그아웃 (세션 삭제)
#[utoipa::path(
    post,
    path = "/soyul/auth/logout",
    request_body = SessionKeyRequest,
    responses(
        (status = 200, description = "로그아웃 성공", body = GenericResponse)
    ),
    tag = "auth"
)]
pub async fn logout(
    State(state): State<LoginState>,
    Json(body): Json<SessionKeyRequest>,
) -> Json<GenericResponse> {
    let removed = destroy_session(&state.sessions, &body.session_key).await;
    if removed {
        Json(GenericResponse {
            success: true,
            message: "로그아웃 되었습니다.".to_string(),
        })
    } else {
        Json(GenericResponse {
            success: true,
            message: "이미 만료된 세션입니다.".to_string(),
        })
    }
}

/// 로그인 관련 라우터
pub fn login_router() -> OpenApiRouter<LoginState> {
    OpenApiRouter::new()
        .routes(routes!(signup))
        .routes(routes!(login))
        .routes(routes!(me))
        .routes(routes!(logout))
}
