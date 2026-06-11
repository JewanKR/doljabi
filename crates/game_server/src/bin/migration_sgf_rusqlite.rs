// migration_sgf_rusqlite.rs
//
// 과거 games 테이블에는 바둑/오목 구분 없이 game_type 이 전부 'baduk' 으로
// 저장되어, AiAnalysis 의 game_type='baduk' 필터가 오목 기보까지 함께 끌어왔다.
// 이 마이그레이션은 각 행의 SGF SZ[]( = board_size )를 기준으로 game_type 을
// 다시 채워 넣는다.
//
//   SZ[15] → 오목(omok),  SZ[19] → 바둑(baduk)
//
// 실행:  cargo run --bin migration_sgf_rusqlite

use rusqlite::{Connection, Result};

/// SGF 본문에서 SZ[n] 의 n 을 뽑아낸다. 없으면 None.
fn parse_sz(sgf: &str) -> Option<u32> {
    let start = sgf.find("SZ[")? + 3;
    let end = sgf[start..].find(']')? + start;
    sgf[start..end].trim().parse().ok()
}

/// 보드 한 변 길이 → game_type 문자열. 15=오목, 19=바둑, 그 외는 None(건너뜀).
fn game_type_of(size: u32) -> Option<&'static str> {
    match size {
        15 => Some("omok"),
        19 => Some("baduk"),
        _ => None,
    }
}

fn main() -> Result<()> {
    let mut conn = Connection::open("mydb.db")?;

    // (id, board_size, sgf) 를 모두 읽어 메모리에 적재한 뒤 갱신한다
    // (query 중 execute 를 섞지 않기 위해 스코프로 stmt 수명 제한).
    let rows: Vec<(i64, i64, String)> = {
        let mut stmt = conn.prepare("SELECT id, board_size, sgf FROM games")?;
        stmt.query_map([], |r| Ok((r.get(0)?, r.get(1)?, r.get(2)?)))?
            .collect::<Result<Vec<_>>>()?
    };

    let total = rows.len();
    let tx = conn.transaction()?;
    let (mut omok, mut baduk, mut skipped) = (0u32, 0u32, 0u32);

    for (id, board_size, sgf) in rows {
        // SGF 의 SZ[] 를 1순위로, 없으면 board_size 컬럼을 fallback 으로 사용
        let size = parse_sz(&sgf).unwrap_or(board_size.max(0) as u32);

        let Some(gtype) = game_type_of(size) else {
            eprintln!("⏭️  건너뜀: id={id}, size={size} (15/19 아님)");
            skipped += 1;
            continue;
        };

        // game_type 과 board_size 둘 다 SGF 기준으로 정합화한다
        tx.execute(
            "UPDATE games SET game_type = ?1, board_size = ?2 WHERE id = ?3",
            rusqlite::params![gtype, size as i64, id],
        )?;

        match gtype {
            "omok" => omok += 1,
            _ => baduk += 1,
        }
    }

    tx.commit()?;
    println!("✅ 마이그레이션 완료: 총 {total}건 → 바둑 {baduk}, 오목 {omok}, 건너뜀 {skipped}");
    Ok(())
}
