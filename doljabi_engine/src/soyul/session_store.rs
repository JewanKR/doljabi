//서버 메모리에 세션을 보관할 타입 정의
use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::RwLock;

pub type UserId = u64;

//서버 메모리에 올려둘 세션 저장소
//key : 세션 키(string)
//value : 유저 고유 ID(UserId)
pub type SessionStore = Arc<RwLock<HashMap<String, UserId>>>;
