// src/game/game_db.rs

use rusqlite::{params, Connection, Result};

/// games 테이블 생성 함수
///
/// 없으면 새로 만들고
///있으면 아무 일도 안 함
pub fn init_games_table(conn: &Connection) -> Result<()> {
    conn.execute(
        r#"
        CREATE TABLE IF NOT EXISTS games (
            id         INTEGER PRIMARY KEY AUTOINCREMENT,  -- 게임 고유번호
            black_id   INTEGER NOT NULL,                   -- 흑 유저 (users.id)
            white_id   INTEGER NOT NULL,                   -- 백 유저 (users.id)
            result     TEXT,                               -- 예: "B+R", "W+5.5", "ongoing"
            created_at TEXT DEFAULT CURRENT_TIMESTAMP      -- 생성 시간
        );
        "#,
        [],
    )?;
    Ok(())
}

/// 새 게임을 생성하고, 생성된 게임 고유번호(game_id)를 리턴
///
/// - `black_id`, `white_id`는 `users.id` (정수 PK)라고 가정
pub fn create_game_db(conn: &Connection, black_id: i64, white_id: i64) -> Result<i64> {
    // 테이블이 없으면 먼저 만들어 두기 (한 번만 실행돼도 상관 없음)
    init_games_table(conn)?;

    conn.execute(
        r#"
        INSERT INTO games (black_id, white_id, result)
        VALUES (?1, ?2, 'ongoing');
        "#,
        params![black_id, white_id],
    )?;

    // 방금 INSERT된 레코드의 rowid = 게임 고유번호
    let game_id = conn.last_insert_rowid();
    Ok(game_id)
}
