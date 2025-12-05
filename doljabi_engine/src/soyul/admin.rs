use std::sync::Arc;

use axum::{
    extract::{Path, State},
    http::StatusCode,
    Json,
};
use rusqlite::{params, Connection};
use serde::{Deserialize, Serialize};
use tokio::sync::Mutex;
use utoipa::ToSchema;
// use utoipa::path; // ❌ 더 이상 필요 없음
use utoipa_axum::{router::OpenApiRouter, routes};

use argon2::{Argon2, PasswordHasher};
use argon2::password_hash::{SaltString, PasswordHash, PasswordVerifier, rand_core::OsRng};

/// DB 커넥션 타입 (SQLite)
pub type Db = Arc<Mutex<Connection>>;

/// 관리자용 상태(State)
#[derive(Clone)]
pub struct AdminState {
    pub db: Db,
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
    pub new_nickname: String,
}

/// 비밀번호 변경 요청 바디
#[derive(Deserialize, ToSchema)]
pub struct UpdatePasswordRequest {
    /// (선택) 기존 비밀번호 – 필요 없으면 프론트에서 안 보내도 됨
    pub old_password: Option<String>,
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
fn hash_password(plain: &str) -> Result<String, argon2::password_hash::Error> {
    let salt = SaltString::generate(&mut OsRng);
    let argon2 = Argon2::default();
    let hash = argon2.hash_password(plain.as_bytes(), &salt)?;
    Ok(hash.to_string())
}

// ───────────────────────────────────────────────────────────────
// 1. 닉네임 변경
// PATCH /admin/users/{user_id}/nickname
// ───────────────────────────────────────────────────────────────

#[utoipa::path(
    patch,
    path = "/admin/users/{user_id}/nickname",
    params(
        ("user_id" = i64, Path, description = "변경할 유저의 ID")
    ),
    request_body = UpdateNicknameRequest,
    responses(
        (status = 200, description = "닉네임 변경 성공", body = GenericResponse),
        (status = 404, description = "해당 유저 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn update_nickname(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
    Json(body): Json<UpdateNicknameRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let rows_affected = {
        let conn = state.db.clone();
        let mut conn = conn.lock().await;

        conn.execute(
            "UPDATE users SET nickname = ?1 WHERE id = ?2",
            params![body.new_nickname, user_id],
        )
        .map_err(internal_error)?
    };

    if rows_affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 ID의 유저를 찾을 수 없습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: "닉네임이 성공적으로 변경되었습니다.".to_string(),
    }))
}

// ───────────────────────────────────────────────────────────────
// 2. 비밀번호 변경
// PATCH /admin/users/{user_id}/password
// ───────────────────────────────────────────────────────────────

#[utoipa::path(
    patch,
    path = "/admin/users/{user_id}/password",
    params(
        ("user_id" = i64, Path, description = "변경할 유저의 ID")
    ),
    request_body = UpdatePasswordRequest,
    responses(
        (status = 200, description = "비밀번호 변경 성공", body = GenericResponse),
        (status = 404, description = "해당 유저 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn update_password(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
    Json(body): Json<UpdatePasswordRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    // 새 비밀번호 해시 생성
    let password_hash = hash_password(&body.new_password).map_err(internal_error)?;

    let rows_affected = {
        let conn = state.db.clone();
        let mut conn = conn.lock().await;

        // users 테이블에 password_hash 컬럼이 있다고 가정
        conn.execute(
            "UPDATE users SET password_hash = ?1 WHERE id = ?2",
            params![password_hash, user_id],
        )
        .map_err(internal_error)?
    };

    if rows_affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 ID의 유저를 찾을 수 없습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: "비밀번호가 성공적으로 변경되었습니다.".to_string(),
    }))
}

// ───────────────────────────────────────────────────────────────
// 3. 밴 여부 설정 (true: 밴, false: 해제)
// PATCH /admin/users/{user_id}/ban
// ───────────────────────────────────────────────────────────────

#[utoipa::path(
    patch,
    path = "/admin/users/{user_id}/ban",
    params(
        ("user_id" = i64, Path, description = "수정할 유저의 ID")
    ),
    request_body = UpdateBanRequest,
    responses(
        (status = 200, description = "밴 상태 변경 성공", body = GenericResponse),
        (status = 404, description = "해당 유저 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn update_ban_status(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
    Json(body): Json<UpdateBanRequest>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let is_banned_int = if body.is_banned { 1 } else { 0 };

    let rows_affected = {
        let conn = state.db.clone();
        let mut conn = conn.lock().await;

        // users 테이블에 is_banned INTEGER(0/1) 컬럼이 있다고 가정
        conn.execute(
            "UPDATE users SET is_banned = ?1 WHERE id = ?2",
            params![is_banned_int, user_id],
        )
        .map_err(internal_error)?
    };

    if rows_affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 ID의 유저를 찾을 수 없습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: if body.is_banned {
            "해당 계정이 밴 처리되었습니다.".to_string()
        } else {
            "해당 계정의 밴이 해제되었습니다.".to_string()
        },
    }))
}

// ───────────────────────────────────────────────────────────────
// 4. 계정 삭제
// DELETE /admin/users/{user_id}
// ───────────────────────────────────────────────────────────────

#[utoipa::path(
    delete,
    path = "/admin/users/{user_id}",
    params(
        ("user_id" = i64, Path, description = "삭제할 유저의 ID")
    ),
    responses(
        (status = 200, description = "계정 삭제 성공", body = GenericResponse),
        (status = 404, description = "해당 유저 없음", body = GenericResponse)
    ),
    tag = "admin"
)]
pub async fn delete_user(
    State(state): State<AdminState>,
    Path(user_id): Path<i64>,
) -> Result<Json<GenericResponse>, (StatusCode, Json<GenericResponse>)> {
    let rows_affected = {
        let conn = state.db.clone();
        let mut conn = conn.lock().await;

        conn.execute("DELETE FROM users WHERE id = ?1", params![user_id])
            .map_err(internal_error)?
    };

    if rows_affected == 0 {
        return Err((
            StatusCode::NOT_FOUND,
            Json(GenericResponse {
                success: false,
                message: "해당 ID의 유저를 찾을 수 없습니다.".to_string(),
            }),
        ));
    }

    Ok(Json(GenericResponse {
        success: true,
        message: "계정이 삭제되었습니다.".to_string(),
    }))
}

// ───────────────────────────────────────────────────────────────
// OpenApiRouter 생성 함수
//  - main.rs에서 admin_router().with_state(AdminState { db }) 이런 식으로 사용
// ───────────────────────────────────────────────────────────────

pub fn admin_router() -> OpenApiRouter<AdminState> {
    OpenApiRouter::new()
        .routes(routes!(update_username))
        .routes(routes!(update_password))
        .routes(routes!(update_ban_status))
        .routes(routes!(delete_user))
}

