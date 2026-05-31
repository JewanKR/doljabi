//! 게임 한 판의 영구 기록 (메타 + 수순) DB 모듈.
//!
//! - `game_history` 테이블에 한 판당 한 행
//! - 수순(moves)은 JSON 문자열로 한 칸에 저장(단순화)
//! - 게임 종료 시점에 `record_finished_game_with_moves` 호출
//! - 프론트 SGF 다운로드용으로 `list_games_for_user` / `get_game_detail_for_user` 제공

use argon2::password_hash::rand_core::{OsRng, RngCore};
use base64::{engine::general_purpose, Engine as _};
use game_core::baduk_board::Color;
use rusqlite::{self, Connection, params};
use serde::{Deserialize, Serialize};
use std::time::{SystemTime, UNIX_EPOCH};
use utoipa::ToSchema;

/// 게임방 고유 ID (랜덤 문자열)
pub type GameId = String;

pub type UserId = i64;

/// 레이팅 타입 (DB INTEGER)
pub type Rating = i32;

/// 게임 종류 — DB에는 문자열로 저장.
#[derive(Debug, Clone, Copy, PartialEq, Eq)]
pub enum GameKind {
    Baduk,
    Omok,
}

impl GameKind {
    pub fn as_str(&self) -> &'static str {
        match self {
            GameKind::Baduk => "baduk",
            GameKind::Omok => "omok",
        }
    }
    pub fn from_str(s: &str) -> Self {
        match s {
            "omok" => GameKind::Omok,
            _ => GameKind::Baduk,
        }
    }
}

/// `winner_color` 컬럼 인코딩 — 기존 코드 호환을 위해 1글자 문자열.
fn color_to_db(color: Color) -> &'static str {
    match color {
        Color::Black => "B",
        Color::White => "W",
        Color::Free => "D",
        _ => "E",
    }
}
fn color_from_db(s: &str) -> Color {
    match s {
        "B" => Color::Black,
        "W" => Color::White,
        "D" => Color::Free,
        _ => Color::ColorError,
    }
}

/// SGF용 'B+R' / 'W+T' / 'B+5.5' / '0' 같은 결과 문자열로 변환.
/// - method는 'R'(resign) / 'T'(time) / 'F'(forfeit) / 'S'(score) 등.
/// - 현재 게임 룸에서 method 정보까지는 분리되어 있지 않으므로
///   기본적으로 승자만 표기('B+' / 'W+'), 무승부는 '0'.
pub fn winner_to_result_string(winner: Color) -> String {
    match winner {
        Color::Black => "B+".to_string(),
        Color::White => "W+".to_string(),
        Color::Free => "0".to_string(),
        _ => String::new(),
    }
}

/// 게임방 랜덤 문자열 생성 (9 bytes → URL-safe Base64 12글자)
pub fn generate_game_id() -> GameId {
    let mut bytes = [0u8; 9];
    OsRng.fill_bytes(&mut bytes);
    general_purpose::URL_SAFE_NO_PAD.encode(&bytes)
}

/// 현재 시간 (Unix time, 초)
pub fn now_unix_time() -> i64 {
    let now = SystemTime::now();
    let duration_since_epoch = now
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");
    duration_since_epoch.as_secs() as i64
}

// ---------------------------------------------------------------------------
// 메모리/내부 구조체
// ---------------------------------------------------------------------------

/// 한 판의 메타 (수순 제외)
#[derive(Debug, Clone)]
pub struct GameHistory {
    pub game_id: GameId,
    pub game_kind: GameKind,
    pub black_player_id: UserId,
    pub white_player_id: UserId,
    pub black_rating_before: Rating,
    pub white_rating_before: Rating,
    pub winner_color: Color,
    pub started_at: i64,
    pub ended_at: i64,
}

/// 수순 한 수. col/row는 0-based, pass면 col<0 && row<0.
#[derive(Debug, Clone, Serialize, Deserialize, ToSchema)]
pub struct MoveRecord {
    pub col: i32,
    pub row: i32,
    /// "black" | "white"
    pub color: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub pass: Option<bool>,
}

// ---------------------------------------------------------------------------
// API 응답용 구조체 — utoipa 스키마 + serde
// ---------------------------------------------------------------------------

/// 목록 한 줄에 들어가는 요약.
#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct GameSummary {
    pub id: String,
    /// "go" | "omok" (프론트 식별자에 맞춤; "baduk"은 "go"로 매핑)
    pub game_type: String,
    pub black_name: String,
    pub white_name: String,
    /// SGF RE 형식 ('B+R' / 'W+T' / '0' 등)
    pub result: String,
    /// ISO-8601 (UTC)
    pub played_at: String,
    pub move_count: i32,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct GameListResponse {
    pub success: bool,
    pub games: Vec<GameSummary>,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct GameDetail {
    pub id: String,
    pub game_type: String,
    pub black_name: String,
    pub white_name: String,
    pub result: String,
    pub played_at: String,
    pub move_count: i32,
    pub history: Vec<MoveRecord>,
}

#[derive(Debug, Clone, Serialize, ToSchema)]
pub struct GameDetailResponse {
    pub success: bool,
    pub game: Option<GameDetail>,
}

// ---------------------------------------------------------------------------
// 스키마 생성
// ---------------------------------------------------------------------------

/// game_history 테이블이 없으면 생성.
/// 기존 컬럼 + (game_type, moves_json, move_count) 추가.
pub fn create_game_history_table_if_not_exists(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS game_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            -- 게임 고유 문자열 (URL-safe 랜덤 ID)
            game_id TEXT UNIQUE,

            -- 'baduk' | 'omok'
            game_type TEXT NOT NULL DEFAULT 'baduk',

            -- 흑/백 플레이어 유저 ID
            black_player_id INTEGER,
            white_player_id INTEGER,

            -- 게임 시작 시점의 레이팅 (변동 전)
            black_rating_before INTEGER,
            white_rating_before INTEGER,

            -- 승자 색 ('B' = 흑, 'W' = 백, 'D' = 무승부)
            winner_color TEXT,

            -- 게임 시작/종료 시간 (Unix time, 초 단위)
            started_at INTEGER,
            ended_at INTEGER,

            -- 수순 JSON ([{c,r,color,pass?}, ...]) — 한 판 통째로 보관
            moves_json TEXT NOT NULL DEFAULT '[]',
            move_count INTEGER NOT NULL DEFAULT 0
        );
        "#,
        [],
    )?;

    // 기존 DB가 있고 신규 컬럼이 없을 수도 있어 보강 (없으면 추가).
    // SQLite는 ADD COLUMN IF NOT EXISTS를 지원하지 않으므로 무시 가능한 에러로 처리.
    let _ = conn.execute(
        "ALTER TABLE game_history ADD COLUMN game_type TEXT NOT NULL DEFAULT 'baduk'",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE game_history ADD COLUMN moves_json TEXT NOT NULL DEFAULT '[]'",
        [],
    );
    let _ = conn.execute(
        "ALTER TABLE game_history ADD COLUMN move_count INTEGER NOT NULL DEFAULT 0",
        [],
    );

    Ok(())
}

// ---------------------------------------------------------------------------
// 저장 (INSERT)
// ---------------------------------------------------------------------------

/// 한 판의 게임 기록 + 수순을 DB에 저장.
/// 보통 "게임이 끝났을 때" 호출.
pub fn record_finished_game_with_moves(
    conn: &Connection,
    game_id: GameId,
    game_kind: GameKind,
    black_player_id: UserId,
    white_player_id: UserId,
    black_rating_before: Rating,
    white_rating_before: Rating,
    winner_color: Color,
    started_at: i64,
    moves: &[MoveRecord],
) -> rusqlite::Result<()> {
    create_game_history_table_if_not_exists(conn)?;

    let moves_json =
        serde_json::to_string(moves).unwrap_or_else(|_| "[]".to_string());
    let move_count = moves.len() as i32;

    conn.execute(
        r#"
        INSERT INTO game_history (
            game_id,
            game_type,
            black_player_id,
            white_player_id,
            black_rating_before,
            white_rating_before,
            winner_color,
            started_at,
            ended_at,
            moves_json,
            move_count
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11);
        "#,
        params![
            game_id,
            game_kind.as_str(),
            black_player_id,
            white_player_id,
            black_rating_before,
            white_rating_before,
            color_to_db(winner_color),
            started_at,
            now_unix_time(),
            moves_json,
            move_count,
        ],
    )?;

    Ok(())
}

// ---------------------------------------------------------------------------
// 조회
// ---------------------------------------------------------------------------

/// 한 줄을 행 → 메타 객체로 변환. 누락된 username은 호출쪽에서 별도 조회.
fn row_to_summary_meta(row: &rusqlite::Row<'_>) -> rusqlite::Result<(GameSummary, i64, i64)> {
    let game_id: String = row.get(0)?;
    let game_type_db: String = row.get(1)?;
    let black_id: i64 = row.get(2)?;
    let white_id: i64 = row.get(3)?;
    let winner_color_str: String = row.get(4)?;
    let ended_at: i64 = row.get(5)?;
    let move_count: i32 = row.get(6)?;

    let game_type = match GameKind::from_str(&game_type_db) {
        GameKind::Baduk => "go".to_string(),
        GameKind::Omok => "omok".to_string(),
    };
    let result = winner_to_result_string(color_from_db(&winner_color_str));
    let played_at = unix_to_iso(ended_at);

    Ok((
        GameSummary {
            id: game_id,
            game_type,
            black_name: String::new(), // 호출 측에서 채움
            white_name: String::new(),
            result,
            played_at,
            move_count,
        },
        black_id,
        white_id,
    ))
}

/// 지정 유저가 흑 또는 백으로 참여한 모든 게임을 최신순으로 반환.
/// black_name / white_name은 users.username을 JOIN으로 채워서 반환.
pub fn list_games_for_user(
    conn: &Connection,
    user_id: UserId,
) -> rusqlite::Result<Vec<GameSummary>> {
    create_game_history_table_if_not_exists(conn)?;

    let mut stmt = conn.prepare(
        r#"
        SELECT
            gh.game_id,
            gh.game_type,
            gh.black_player_id,
            gh.white_player_id,
            gh.winner_color,
            gh.ended_at,
            gh.move_count,
            COALESCE(ub.username, '') AS black_name,
            COALESCE(uw.username, '') AS white_name
        FROM game_history gh
        LEFT JOIN users ub ON ub.id = gh.black_player_id
        LEFT JOIN users uw ON uw.id = gh.white_player_id
        WHERE gh.black_player_id = ?1 OR gh.white_player_id = ?1
        ORDER BY gh.ended_at DESC
        LIMIT 200
        "#,
    )?;

    let iter = stmt.query_map([user_id], |row| {
        let (mut summary, _b, _w) = row_to_summary_meta(row)?;
        summary.black_name = row.get(7)?;
        summary.white_name = row.get(8)?;
        Ok(summary)
    })?;

    let mut out = Vec::new();
    for r in iter {
        out.push(r?);
    }
    Ok(out)
}

/// 지정 게임의 상세(수순 포함)를 반환.
/// 요청자(user_id)가 흑/백 중 하나여야 함 (권한 체크).
/// 없거나 권한 없으면 Ok(None).
pub fn get_game_detail_for_user(
    conn: &Connection,
    user_id: UserId,
    game_id: &str,
) -> rusqlite::Result<Option<GameDetail>> {
    create_game_history_table_if_not_exists(conn)?;

    let mut stmt = conn.prepare(
        r#"
        SELECT
            gh.game_id,
            gh.game_type,
            gh.black_player_id,
            gh.white_player_id,
            gh.winner_color,
            gh.ended_at,
            gh.move_count,
            COALESCE(ub.username, '') AS black_name,
            COALESCE(uw.username, '') AS white_name,
            gh.moves_json
        FROM game_history gh
        LEFT JOIN users ub ON ub.id = gh.black_player_id
        LEFT JOIN users uw ON uw.id = gh.white_player_id
        WHERE gh.game_id = ?1
          AND (gh.black_player_id = ?2 OR gh.white_player_id = ?2)
        LIMIT 1
        "#,
    )?;

    let res = stmt.query_row(params![game_id, user_id], |row| {
        let (mut summary, _b, _w) = row_to_summary_meta(row)?;
        summary.black_name = row.get(7)?;
        summary.white_name = row.get(8)?;
        let moves_json: String = row.get(9)?;
        let history: Vec<MoveRecord> =
            serde_json::from_str(&moves_json).unwrap_or_default();
        Ok(GameDetail {
            id: summary.id,
            game_type: summary.game_type,
            black_name: summary.black_name,
            white_name: summary.white_name,
            result: summary.result,
            played_at: summary.played_at,
            move_count: summary.move_count,
            history,
        })
    });

    match res {
        Ok(detail) => Ok(Some(detail)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}

// ---------------------------------------------------------------------------
// 헬퍼
// ---------------------------------------------------------------------------

/// Unix time(초) → ISO-8601 UTC 문자열 ('YYYY-MM-DDTHH:MM:SSZ')
/// chrono 의존성을 새로 추가하지 않으려고 직접 변환.
fn unix_to_iso(unix_secs: i64) -> String {
    // 1970-01-01 부터의 일/초 계산 (그레고리력).
    let mut days = unix_secs.div_euclid(86_400);
    let secs_of_day = unix_secs.rem_euclid(86_400);
    let hh = secs_of_day / 3600;
    let mm = (secs_of_day % 3600) / 60;
    let ss = secs_of_day % 60;

    // 1970-01-01이 (year=1970, month=1, day=1)
    let mut year: i64 = 1970;
    loop {
        let days_in_year = if is_leap(year) { 366 } else { 365 };
        if days < days_in_year {
            break;
        }
        days -= days_in_year;
        year += 1;
    }
    // negative years (pre-1970) — rough handling
    while days < 0 {
        year -= 1;
        let days_in_year = if is_leap(year) { 366 } else { 365 };
        days += days_in_year;
    }

    let months_lengths = if is_leap(year) {
        [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    } else {
        [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
    };
    let mut month = 1;
    let mut day_in_month = days;
    for &ml in months_lengths.iter() {
        if day_in_month < ml as i64 {
            break;
        }
        day_in_month -= ml as i64;
        month += 1;
    }
    day_in_month += 1; // 1-based

    format!(
        "{:04}-{:02}-{:02}T{:02}:{:02}:{:02}Z",
        year, month, day_in_month, hh, mm, ss
    )
}

fn is_leap(year: i64) -> bool {
    (year % 4 == 0 && year % 100 != 0) || (year % 400 == 0)
}

// ---------------------------------------------------------------------------
// 테스트
// ---------------------------------------------------------------------------

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn id_length() {
        let id = generate_game_id();
        assert_eq!(id.len(), 12);
    }

    #[test]
    fn insert_and_list_and_detail() {
        let conn = Connection::open_in_memory().unwrap();

        // users 테이블 — list_games_for_user JOIN 대상
        conn.execute(
            "CREATE TABLE users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                login_id TEXT, password_hash TEXT,
                username TEXT, rating INTEGER DEFAULT 1500,
                win INTEGER DEFAULT 0, lose INTEGER DEFAULT 0, draw INTEGER DEFAULT 0
            )",
            [],
        ).unwrap();
        conn.execute(
            "INSERT INTO users (id, login_id, password_hash, username) VALUES (1, 'a', 'x', 'Alice'), (2, 'b', 'y', 'Bob')",
            [],
        ).unwrap();

        let moves = vec![
            MoveRecord { col: 15, row: 3, color: "black".into(), pass: None },
            MoveRecord { col: 3, row: 15, color: "white".into(), pass: None },
            MoveRecord { col: -1, row: -1, color: "black".into(), pass: Some(true) },
        ];

        let gid = generate_game_id();
        record_finished_game_with_moves(
            &conn,
            gid.clone(),
            GameKind::Baduk,
            1, 2,
            1500, 1500,
            Color::Black,
            1_738_000_000,
            &moves,
        ).unwrap();

        let list = list_games_for_user(&conn, 1).unwrap();
        assert_eq!(list.len(), 1);
        assert_eq!(list[0].black_name, "Alice");
        assert_eq!(list[0].white_name, "Bob");
        assert_eq!(list[0].result, "B+");
        assert_eq!(list[0].move_count, 3);

        let detail = get_game_detail_for_user(&conn, 2, &gid).unwrap().unwrap();
        assert_eq!(detail.history.len(), 3);
        assert_eq!(detail.history[2].pass, Some(true));

        // 권한 없는 유저는 None
        assert!(get_game_detail_for_user(&conn, 999, &gid).unwrap().is_none());
    }
}
