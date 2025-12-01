use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;
use argon2::password_hash::rand_core::{OsRng, RngCore};
use base64::{engine::general_purpose, Engine as _};

pub type UserId = u64;

//서버 메모리에 올려둘 세션 저장소
//key : 세션 키(string)
//value : 유저 고유 ID(UserId)
pub type SessionStore = Arc<RwLock<HashMap<String, UserId>>>;

//4096비트의 랜덤 세션키를 생성해서 URL-safe Base64 문자열로 반환
pub fn generate_session_key() -> String {
    let mut bytes = [0u8; 512]; //512 바이트 = 4096 비트
    OsRng.fill_bytes(&mut bytes); // 난수생성기
    general_purpose::URL_SAFE_NO_PAD.encode(&bytes) // URL-safe Base64 문자열로 인코딩
}

/// 세션 추가: (session_key -> user_id)
pub async fn insert_session(store: &SessionStore, session_key: String, user_id: UserId) {
    let mut map = store
        .write()
        .await;
    map.insert(session_key, user_id);
}

/// 세션 조회: 세션키로 user_id 얻기
pub async fn get_user_id_by_session(store: &SessionStore, session_key: &str) -> Option<UserId> {
    let map = store
        .read()
        .await;
    map.get(session_key).copied()
}

/// 세션 삭제 (로그아웃용)
pub async fn remove_session(store: &SessionStore, session_key: &str) {
    let mut map = store
        .write()
        .await;
    map.remove(session_key);
}