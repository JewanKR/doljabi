// src/soyul/session_service.rs

use crate::soyul::session_store::{SessionStore};

/// 세션 추가: (session_key -> user_id)
pub async fn insert_session(store: &SessionStore, session_key: String, user_id: u64) {
    let mut map = store
        .write();
    map.await.insert(session_key, user_id);
}

/// 세션 조회: 세션키로 user_id 얻기
pub async fn get_user_id_by_session(store: &SessionStore, session_key: &str) -> Option<u64> {
    let map = store
        .read();
    map.await.get(session_key).copied()
}

/// 세션 삭제 (로그아웃용)
pub async fn remove_session(store: &SessionStore, session_key: &str) {
    let mut map = store
        .write();
    map.await.remove(session_key);
}
