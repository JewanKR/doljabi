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

/// 세션키로 유저 아이디 조회
pub async fn session_to_user_id(
    session_store: &SessionStore,
    session_key: &str,
) -> Option<UserId> {
    let map = session_store.read().await;
    map.get(session_key).copied()
}

// 단위 테스트
/*#[cfg(test)]
mod tests {
    use super::*;
    use tokio; // #[tokio::test]용

    #[tokio::test]
    async fn generate_session_key_is_random_and_long() {
        let k1 = generate_session_key();
        let k2 = generate_session_key();

        // 1) 둘은 거의 항상 달라야 함
        assert_ne!(k1, k2);

        // 2) 충분히 긴지 (512바이트 base64라 600자 이상)
        assert!(k1.len() > 600);
    }

    #[tokio::test]
    async fn insert_and_get_session_works() {
        let store: SessionStore = Arc::new(RwLock::new(HashMap::new()));
        let key = generate_session_key();
        let user_id: UserId = 42;

        insert_session(&store, key.clone(), user_id).await;

        let got = get_user_id_by_session(&store, &key).await;
        assert_eq!(got, Some(user_id));
    }

    #[tokio::test]
    async fn remove_session_works() {
        let store: SessionStore = Arc::new(RwLock::new(HashMap::new()));
        let key = generate_session_key();
        let user_id: UserId = 99;

        insert_session(&store, key.clone(), user_id).await;
        assert!(get_user_id_by_session(&store, &key).await.is_some());

        remove_session(&store, &key).await;
        assert!(get_user_id_by_session(&store, &key).await.is_none());
    }

    #[tokio::test]
    async fn session_to_user_id_works() {
        let store: SessionStore = Arc::new(RwLock::new(HashMap::new()));
        let key = generate_session_key();
        let user_id: UserId = 777;

        insert_session(&store, key.clone(), user_id).await;

        let got = session_to_user_id(&store, &key).await;
        assert_eq!(got, Some(user_id));

        let got_none = session_to_user_id(&store, "non-existent-key").await;
        assert_eq!(got_none, None);
    }
}*/
