//게임방 랜덤 문자열 생성
//게임방 고유 아이디
//플레이어 아이디, 검은색 플레이어 아이디
//게임시작시 흰색 플레이어 레이팅, 검은색 플레이어 레이팅
//게임종료 시 승자 색 저장 >> DB
//게임 시작시간, 끝난 시간(유닉스 타임으로 저장)
use argon2::password_hash::rand_core::{OsRng, RngCore};
use base64::{engine::general_purpose, Engine as _};
use rusqlite::{self, Connection, params};
use std::time::{SystemTime, UNIX_EPOCH};
use crate::geme_old::badukboard::Color;

/// 게임방 고유 ID (랜덤 문자열)
pub type GameId = String;

pub type UserId = i64;

impl Color {
    pub fn to_str(&self) -> &str {
        match self {
            Color::Black => "B",
            Color::White => "W",
            Color::Free => "D",
            Color::ColorError => "E",
        }
    }
}

/// 레이팅 타입 (DB에서 INTEGER로 쓰고 있으니까 i32)
pub type Rating = i32;

/// 게임방 랜덤 문자열 생성
///
/// 9바이트(72비트) 랜덤 → Base64 URL_SAFE_NO_PAD 인코딩 → 12글자 문자열
pub fn generate_game_id() -> GameId {
    let mut bytes = [0u8; 9]; // 9 bytes = 72 bits
    OsRng.fill_bytes(&mut bytes);
    general_purpose::URL_SAFE_NO_PAD.encode(&bytes)
}

/// 현재 시간을 Unix time(초 단위)으로 반환
///
/// - 1970-01-01 00:00:00 UTC 기준 지난 초(sec)를 i64로 리턴
pub fn now_unix_time() -> i64 {
    let now = SystemTime::now();
    let duration_since_epoch = now
        .duration_since(UNIX_EPOCH)
        .expect("Time went backwards");

    duration_since_epoch.as_secs() as i64
}

//한 판의 게임 기록을 나타내는 구조체
//나중에 이 구조체의 내용이 그대로 DB에 저장될 예정
#[derive(Debug, Clone)]
pub struct GameHistory {
    //게임을 구분하는 고유 문자열(메모리/로그용 키)
    pub game_id: GameId,
    //흑백 플레이어 유저 아이디
    pub black_player_id: UserId,
    pub white_player_id: UserId,
    //게임 시작 시점의 레이팅(변동 전)
    pub black_rating_before: Rating,
    pub white_rating_before: Rating,
    pub winner_color: Color,
    pub started_at: i64, // 게임 시작 시간, 유닉스 타임, 초 단위
    pub ended_at: i64,   // 게임 종료 시간, 유닉스 타임, 초 단위
}

/// game_history 테이블이 없으면 생성하는 함수
///
/// - 나중에 main.rs나 초기화 코드에서
///   `create_game_history_table_if_not_exists(&conn)?;` 이런 식으로 한 번만 호출해 주면 됨.
pub fn create_game_history_table_if_not_exists(conn: &Connection) -> rusqlite::Result<()> {
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS game_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,

            -- 게임 고유 문자열 (URL-safe 랜덤 ID)
            game_id TEXT UNIQUE,

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
            ended_at INTEGER
        );
        "#,
        [],
    )?;

    Ok(())
}

//한 판의 게임 기록을 DB에 저장하는 함수
//
//보통 게임이 끝났을 때 최종 결과를 기록할 때 사용
/// 한 판의 게임 기록을 DB에 INSERT 하는 함수
///
/// - 보통 "게임이 끝났을 때" 최종 결과를 기록할 때 사용
pub fn insert_game_history(conn: &Connection, history: &GameHistory) -> rusqlite::Result<()> {
    // Color → DB에 넣을 문자열로 변환
    let winner_color_str: &str = match history.winner_color {
        Color::Black => "B",
        Color::White => "W",
        Color::Free => "D",
        _ => "E"
    };

    conn.execute(
        r#"
        INSERT INTO game_history (
            game_id,
            black_player_id,
            white_player_id,
            black_rating_before,
            white_rating_before,
            winner_color,
            started_at,
            ended_at
        )
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8);
        "#,
        params![
            history.game_id,
            history.black_player_id as i64,
            history.white_player_id as i64,
            history.black_rating_before,
            history.white_rating_before,
            winner_color_str,
            history.started_at,
            history.ended_at,
        ],
    )?;

    Ok(())
}

/// 게임 종료 시, 한 판의 결과를 GameHistory로 만들어 DB에 저장하는 편의 함수.
///
/// - 보통 "게임이 끝났다"는 이벤트에서 이 함수만 한 번 호출해주면 됨.
/// - started_at은 "게임이 시작할 때" 어딘가에 기록해두었다가 그대로 넘겨줘야 함.
pub fn record_finished_game(
    conn: &Connection,
    game_id: GameId,
    black_player_id: UserId,
    white_player_id: UserId,
    black_rating_before: Rating,
    white_rating_before: Rating,
    winner_color: Color,
    started_at: i64,
) -> rusqlite::Result<()> {
    let history = GameHistory {
        game_id,
        black_player_id,
        white_player_id,
        black_rating_before,
        white_rating_before,
        winner_color,
        started_at,
        ended_at: now_unix_time(), // 🔹 여기서 끝난 시각 자동으로 채움
    };

    insert_game_history(conn, &history)
}


/// game_id로 게임 기록을 조회하는 함수
///
/// - 있으면 Some(GameHistory)
/// - 없으면 None
pub fn get_game_history_by_id(
    conn: &Connection,
    game_id: &str,
) -> rusqlite::Result<Option<GameHistory>> {

    let mut stmt = conn.prepare(
        r#"
        SELECT
            game_id,
            black_player_id,
            white_player_id,
            black_rating_before,
            white_rating_before,
            winner_color,
            started_at,
            ended_at
        FROM game_history
        WHERE game_id = ?1
        "#,
    )?;

    let row = stmt.query_row([game_id], |row| {
        // winner_color: TEXT (required)
        let winner_color_str: String = row.get(5)?;

        Ok(GameHistory {
            game_id: row.get(0)?,

            black_player_id: row.get::<_, i64>(1).expect("Invalid black_player_id in database"),
            white_player_id: row.get::<_, i64>(2).expect("Invalid white_player_id in database"),

            black_rating_before: row.get(3)?,
            white_rating_before: row.get(4)?,

            winner_color: Color::from_str(&winner_color_str),

            started_at: row.get(6)?,
            ended_at: row.get(7)?,
        })
    });

    match row {
        Ok(history) => Ok(Some(history)),
        Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
        Err(e) => Err(e),
    }
}


impl Color {
    pub fn from_str(s: &str) -> Self {
        match s {
            "B" => Color::Black,
            "W" => Color::White,
            "D" => Color::Free,
            _ => Color::ColorError,
        }
    }
}







/// 테스트
#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;

    #[test]
    fn test_generate_game_id_basic() {
        let id1 = generate_game_id();
        let id2 = generate_game_id();

        // 길이 적당한지
        assert_eq!(id1.len(), 12);
        assert_eq!(id2.len(), 12);

        // 두 번 만들었을 때 보통은 달라야 함
        assert_ne!(id1, id2);
    }

    #[test]
    fn test_insert_and_get_game_history() {
        // 1) 메모리 DB(테스트용, 파일 안 만듦)
        let conn = Connection::open_in_memory().unwrap();

        // 2) game_history 테이블 생성
        create_game_history_table_if_not_exists(&conn).unwrap();

        // 3) 테스트용 GameHistory 하나 만들기
        let game_id = generate_game_id();

        let original = GameHistory {
            game_id: game_id.clone(),
            black_player_id: 1,
            white_player_id: 2,
            black_rating_before: 1500,
            white_rating_before: 1520,
            winner_color: Color::Black,
            started_at: 1_738_000_000,
            ended_at: 1_738_000_900,
        };

        // 4) DB에 INSERT
        insert_game_history(&conn, &original).unwrap();

        // 5) 다시 SELECT해서 가져오기
        let loaded = get_game_history_by_id(&conn, &game_id)
            .unwrap()
            .expect("저장한 게임이 조회되지 않음");

        // 6) 값이 제대로 저장됐는지 비교
        assert_eq!(loaded.game_id, original.game_id);
        assert_eq!(loaded.black_player_id, original.black_player_id);
        assert_eq!(loaded.white_player_id, original.white_player_id);
        assert_eq!(loaded.black_rating_before, original.black_rating_before);
        assert_eq!(loaded.white_rating_before, original.white_rating_before);
        assert_eq!(loaded.winner_color, original.winner_color);
        assert_eq!(loaded.started_at, original.started_at);
        assert_eq!(loaded.ended_at, original.ended_at);
    }

    #[test]
    fn test_record_finished_game_helper() {
        let conn = Connection::open_in_memory().unwrap();
        create_game_history_table_if_not_exists(&conn).unwrap();

        let game_id = generate_game_id();

        // 게임 시작 시점이라고 가정
        let started_at = 1_738_000_000;

        record_finished_game(
            &conn,
            game_id.clone(),
            10,   // black_player_id
            20,   // white_player_id
            1500, // black_rating_before
            1550, // white_rating_before
            Color::White,
            started_at,
        ).unwrap();

        let loaded = get_game_history_by_id(&conn, &game_id)
            .unwrap()
            .expect("record_finished_game로 저장한 게임이 조회되지 않음");

        assert_eq!(loaded.game_id, game_id);
        assert_eq!(loaded.black_player_id, 10);
        assert_eq!(loaded.white_player_id, 20);
        assert_eq!(loaded.black_rating_before, 1500);
        assert_eq!(loaded.white_rating_before, 1550);
        assert_eq!(loaded.winner_color, Color::White);
        assert_eq!(loaded.started_at, started_at);

        // ended_at은 now_unix_time()이라 정확한 값 비교는 어렵지만,
        // "started_at 이후냐?" 정도는 체크할 수 있음
        assert!(loaded.ended_at >= started_at);
    }
}

