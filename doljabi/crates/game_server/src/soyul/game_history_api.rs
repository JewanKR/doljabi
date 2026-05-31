//! 게임 기록 조회 HTTP API.
//!
//! 프론트엔드 `web/src/api/games.js`가 기대하는 두 엔드포인트를 제공.
//!   - GET /api/user/games/session/{session_key}                    — 내 대국 목록
//!   - GET /api/user/games/{game_id}/session/{session_key}          — 단건 + 수순
//!
//! 둘 다 세션키로 로그인 유저를 식별하고, 그 유저가 흑/백 중 하나로 참여한 게임만
//! 반환(권한 체크).

use axum::{
    Json,
    extract::{Path, State},
    http::StatusCode,
    response::IntoResponse,
};
use rusqlite::Connection;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::soyul::{
    gamehistory_db::{
        GameDetailResponse, GameListResponse, get_game_detail_for_user, list_games_for_user,
    },
    session::{SessionStore, get_user_id_by_session},
};

#[utoipa::path(
    get,
    path = "/api/user/games/session/{session_key}",
    tag = "user",
    params(
        ("session_key" = String, Path, description = "세션 키")
    ),
    responses(
        (status = 200, description = "내 대국 목록 조회 성공", body = GameListResponse),
        (status = 400, description = "세션 키가 올바르지 않음"),
        (status = 500, description = "서버 내부 오류"),
    )
)]
pub async fn get_my_games(
    State(session_store): State<SessionStore>,
    Path(session_key): Path<String>,
) -> impl IntoResponse {
    let user_id_opt = get_user_id_by_session(&session_store, &session_key).await;
    let user_id = match user_id_opt {
        Some(id) => id,
        None => return StatusCode::BAD_REQUEST.into_response(),
    };

    let conn = match Connection::open("mydb.db") {
        Ok(c) => c,
        Err(e) => {
            eprintln!("⚠️ 게임 목록 조회(DB 오픈 실패): {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    match list_games_for_user(&conn, i64::from(user_id)) {
        Ok(games) => {
            #[cfg(debug_assertions)]
            println!(
                "✅ 게임 목록 조회: user_id={}, 건수={}",
                user_id,
                games.len()
            );
            (
                StatusCode::OK,
                Json(GameListResponse {
                    success: true,
                    games,
                }),
            )
                .into_response()
        }
        Err(e) => {
            eprintln!("⚠️ 게임 목록 조회 실패: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/user/games/{game_id}/session/{session_key}",
    tag = "user",
    params(
        ("game_id" = String, Path, description = "게임 고유 ID"),
        ("session_key" = String, Path, description = "세션 키"),
    ),
    responses(
        (status = 200, description = "게임 상세 조회 성공", body = GameDetailResponse),
        (status = 400, description = "세션 키가 올바르지 않음"),
        (status = 404, description = "해당 게임이 없거나 권한 없음"),
        (status = 500, description = "서버 내부 오류"),
    )
)]
pub async fn get_my_game_detail(
    State(session_store): State<SessionStore>,
    Path((game_id, session_key)): Path<(String, String)>,
) -> impl IntoResponse {
    let user_id_opt = get_user_id_by_session(&session_store, &session_key).await;
    let user_id = match user_id_opt {
        Some(id) => id,
        None => return StatusCode::BAD_REQUEST.into_response(),
    };

    let conn = match Connection::open("mydb.db") {
        Ok(c) => c,
        Err(e) => {
            eprintln!("⚠️ 게임 상세 조회(DB 오픈 실패): {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    match get_game_detail_for_user(&conn, i64::from(user_id), &game_id) {
        Ok(Some(detail)) => (
            StatusCode::OK,
            Json(GameDetailResponse {
                success: true,
                game: Some(detail),
            }),
        )
            .into_response(),
        Ok(None) => StatusCode::NOT_FOUND.into_response(),
        Err(e) => {
            eprintln!("⚠️ 게임 상세 조회 실패: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

pub fn game_history_router() -> OpenApiRouter<SessionStore> {
    OpenApiRouter::new()
        .routes(routes!(get_my_games))
        .routes(routes!(get_my_game_detail))
}
