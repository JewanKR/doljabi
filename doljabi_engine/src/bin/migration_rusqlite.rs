use rusqlite::{Connection, Result};
use std::collections::{HashMap, HashSet};

fn main() -> Result<()> {
    // 1. DB 연결
    let mut conn = Connection::open("mydb.db")?;

    // 2. 일단 테이블이 아예 없다면 최신 스키마로 생성 (기존 데이터가 없는 경우)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            login_id TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            username TEXT UNIQUE,
            rating INTEGER DEFAULT 1500,
            win INTEGER DEFAULT 0,
            lose INTEGER DEFAULT 0,
            draw INTEGER DEFAULT 0
        )",
        [],
    )?;

    // 3. 스키마 동기화 실행
    sync_users_schema(&mut conn)?;

    println!("DB Schema synchronized successfully.");
    Ok(())
}

fn sync_users_schema(conn: &mut Connection) -> Result<()> {
    let table_name = "users";

    // --- A. 목표 스키마 정의 (코드 상의 최신 스펙) ---
    // 주의: ALTER TABLE ADD COLUMN은 PRIMARY KEY, UNIQUE, NOT NULL 제약조건을 추가할 수 없습니다.
    // 따라서 추가 가능한 컬럼만 여기에 정의합니다.
    // id, login_id, password_hash, username은 테이블 생성 시에만 정의되므로 여기서는 제외합니다.
    let mut target_schema = HashMap::new();
    target_schema.insert("rating".to_string(), "INTEGER DEFAULT 1500");
    target_schema.insert("win".to_string(), "INTEGER DEFAULT 0");
    target_schema.insert("lose".to_string(), "INTEGER DEFAULT 0");
    target_schema.insert("draw".to_string(), "INTEGER DEFAULT 0");

    // --- B. 현재 DB 스키마 확인 ---
    // stmt의 생명주기를 명시적으로 제한하기 위해 스코프 사용
    let current_columns: HashSet<String> = {
        let mut stmt = conn.prepare(&format!("PRAGMA table_info({})", table_name))?;
        stmt.query_map([], |row| {
            let name: String = row.get(1)?; // 1번째 인덱스가 name
            Ok(name)
        })?
        .collect::<Result<HashSet<_>, _>>()?
    };

    // 트랜잭션 시작 (안전성 확보)
    let tx = conn.transaction()?;

    // --- C. 칼럼 추가 (Migration: Add Column) ---
    for (col_name, col_def) in &target_schema {
        if !current_columns.contains(col_name) {
            println!("Adding missing column: {}", col_name);
            let sql = format!("ALTER TABLE {} ADD COLUMN {} {}", table_name, col_name, col_def);
            if let Err(e) = tx.execute(&sql, []) {
                eprintln!("⚠️ 컬럼 추가 실패: {} - {}", col_name, e);
                // 에러가 발생해도 계속 진행 (이미 존재하는 경우 등)
            }
        }
    }

    // --- D. 칼럼 삭제 (Migration: Drop Column) ---
    // 주의: SQLite 버전 3.35.0 이상이어야 DROP COLUMN이 가능합니다.
    // rusqlite는 보통 최신 번들 버전을 사용하므로 대부분 동작합니다.
    // 핵심 컬럼(id, login_id, password_hash, username)은 삭제하지 않도록 보호
    let protected_columns: HashSet<&str> = ["id", "login_id", "password_hash", "username"]
        .iter()
        .cloned()
        .collect();
    
    for col_name in &current_columns {
        if !target_schema.contains_key(col_name) && !protected_columns.contains(col_name.as_str()) {
            println!("Removing deprecated column: {}", col_name);
            let sql = format!("ALTER TABLE {} DROP COLUMN {}", table_name, col_name);
            if let Err(e) = tx.execute(&sql, []) {
                eprintln!("⚠️ 컬럼 삭제 실패: {} - {}", col_name, e);
                // 에러가 발생해도 계속 진행
            }
        }
    }

    tx.commit()?;
    Ok(())
}