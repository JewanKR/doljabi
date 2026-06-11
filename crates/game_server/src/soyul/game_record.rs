// game_record.rs
//
// 종료되어 games 테이블에 저장된 게임을 클라이언트로 내려주는 REST API.
//  - GET /api/games/{game_id}/sgf            : 단일 게임 기보(SGF) 다운로드
//  - GET /api/user/games/session/{session_key}: 로그인 유저의 게임 리스트(메타)

use axum::{
    Json,
    extract::{Path, Query, State},
    http::StatusCode,
    response::IntoResponse,
};
use rusqlite::{Connection, params};
use serde::{Deserialize, Serialize};
use utoipa::{IntoParams, ToSchema};
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::soyul::session::{SessionStore, get_user_id_by_session};

//
// ── 단일 게임 기보(SGF) 다운로드 ──
//
// SGF는 self-describing 포맷이라 board_size(SZ)/result(RE)/플레이어(PB·PW)/
// game_type(GM)이 본문에 모두 들어 있으므로, 응답은 sgf 한 필드면 충분하다.
//

#[derive(Serialize, ToSchema)]
pub struct GameSgfResponse {
    /// SGF 기보 본문 (수순·결과·플레이어·보드크기가 모두 포함된 완성본)
    pub sgf: String,
}

#[utoipa::path(
    get,
    path = "/api/games/{game_id}/sgf",
    tag = "game",
    params(
        ("game_id" = i64, Path, description = "게임 고유 번호 (games.id)")
    ),
    responses(
        (status = 200, description = "기보 조회 성공", body = GameSgfResponse),
        (status = 404, description = "해당 게임 없음"),
        (status = 500, description = "서버 내부 오류"),
    )
)]
pub async fn get_game_sgf(Path(game_id): Path<i64>) -> impl IntoResponse {
    let conn = match Connection::open("mydb.db") {
        Ok(c) => c,
        Err(e) => {
            eprintln!("⚠️ 기보 조회(DB 오픈 실패): {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    let sgf: rusqlite::Result<String> =
        conn.query_row("SELECT sgf FROM games WHERE id = ?1", [game_id], |row| {
            row.get(0)
        });

    match sgf {
        Ok(sgf) => {
            #[cfg(debug_assertions)]
            println!("✅ 기보 조회 성공: game_id={}", game_id);
            (StatusCode::OK, Json(GameSgfResponse { sgf })).into_response()
        }
        Err(rusqlite::Error::QueryReturnedNoRows) => {
            eprintln!("❌ 기보 조회 실패: game_id={} 없음", game_id);
            StatusCode::NOT_FOUND.into_response()
        }
        Err(e) => {
            eprintln!("⚠️ 기보 조회 에러: {}", e);
            StatusCode::INTERNAL_SERVER_ERROR.into_response()
        }
    }
}

//
// ── 로그인 유저의 게임 리스트 ──
//
// 리스트는 sgf 본문을 내려주지 않으므로(가볍게), 화면 표시에 필요한 메타만 담는다.
//

/// 게임 리스트 조회 시 선택적 필터(URL 쿼리 스트링).
#[derive(Deserialize, IntoParams)]
#[into_params(parameter_in = Query)]
pub struct GameListQuery {
    /// 게임 종류 필터: "baduk" | "omok". 생략 시 전체 반환
    pub game_type: Option<String>,
}

#[derive(Serialize, ToSchema)]
pub struct GameSummary {
    pub id: i64,
    /// "baduk" | "omok"
    pub game_type: String,
    pub board_size: i32,
    /// SGF RE[] 형식 ("B+R", "W+T", "B+5", "Draw"). 미정이면 null
    pub result: Option<String>,
    /// 요청자 입장에서 상대 플레이어의 user_id
    pub opponent_id: i64,
    /// 요청자가 둔 색 ("black" | "white")
    pub my_color: String,
    pub created_at: String,
}

#[derive(Serialize, ToSchema)]
pub struct GameListResponse {
    pub success: bool,
    pub message: String,
    pub games: Vec<GameSummary>,
}

#[utoipa::path(
    get,
    path = "/api/user/games/session/{session_key}",
    tag = "game",
    params(
        ("session_key" = String, Path, description = "세션 키"),
        GameListQuery,
    ),
    responses(
        (status = 200, description = "게임 리스트 조회 성공", body = GameListResponse),
        (status = 400, description = "세션 키가 올바르지 않음"),
        (status = 500, description = "서버 내부 오류"),
    )
)]
pub async fn get_my_games(
    State(session_store): State<SessionStore>,
    Path(session_key): Path<String>,
    Query(q): Query<GameListQuery>,
) -> impl IntoResponse {
    // 세션키 → user_id
    let user_id = match get_user_id_by_session(&session_store, &session_key).await {
        Some(id) => i64::from(id),
        None => return StatusCode::BAD_REQUEST.into_response(),
    };

    let conn = match Connection::open("mydb.db") {
        Ok(c) => c,
        Err(e) => {
            eprintln!("⚠️ 게임 리스트 조회(DB 오픈 실패): {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    let mut stmt = match conn.prepare(
        "SELECT id, black_id, white_id, game_type, board_size, result, created_at
         FROM games
         WHERE (black_id = ?1 OR white_id = ?1)
           AND (?2 IS NULL OR game_type = ?2)
         ORDER BY datetime(created_at) DESC, id DESC",
    ) {
        Ok(s) => s,
        Err(e) => {
            eprintln!("⚠️ 게임 리스트 쿼리 준비 실패: {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    let rows = stmt.query_map(params![user_id, q.game_type], |row| {
        let black_id: i64 = row.get(1)?;
        let white_id: i64 = row.get(2)?;
        let (my_color, opponent_id) = if black_id == user_id {
            ("black".to_string(), white_id)
        } else {
            ("white".to_string(), black_id)
        };
        Ok(GameSummary {
            id: row.get(0)?,
            game_type: row.get(3)?,
            board_size: row.get(4)?,
            result: row.get(5)?,
            opponent_id,
            my_color,
            created_at: row.get(6)?,
        })
    });

    let games: Vec<GameSummary> = match rows {
        Ok(iter) => iter.filter_map(|r| r.ok()).collect(),
        Err(e) => {
            eprintln!("⚠️ 게임 리스트 조회 에러: {}", e);
            return StatusCode::INTERNAL_SERVER_ERROR.into_response();
        }
    };

    #[cfg(debug_assertions)]
    println!(
        "✅ 게임 리스트 조회 성공: user_id={}, {}건",
        user_id,
        games.len()
    );

    (
        StatusCode::OK,
        Json(GameListResponse {
            success: true,
            message: "게임 리스트 조회 성공".into(),
            games,
        }),
    )
        .into_response()
}

pub fn sgf_router() -> OpenApiRouter<SessionStore> {
    OpenApiRouter::new()
        .routes(routes!(get_game_sgf))
        .routes(routes!(get_my_games))
}
