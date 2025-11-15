use std::{collections::{HashMap, HashSet, VecDeque}, sync::Arc};

use axum::{Json, extract::State, response::IntoResponse};
use serde::{self, Deserialize, Serialize};
use tokio::sync::{RwLock, mpsc};
use crate::{game::badukboard::BadukBoardGameConfig, soyul::session::{SessionStore, UserId}};
 /* 
pub struct EnterCodeManager {
    counter: u16,
    released_number: VecDeque<u16>,
} impl EnterCodeManager {
    pub fn new() -> Self { Self { counter: u16::MAX, released_number: VecDeque::<u16>::from([u16::MAX]) } }

    pub fn get(&mut self) -> Result<u16, ()> {
        match self.released_number.pop_front() {
            Some(num) => Ok(num),
            None => { match self.counter.checked_sub(1) {
                Some(num) => {self.counter = num; Ok(num)},
                None => Err(())
            }}
        }
    }

    pub fn release(&mut self, num: u16) {
        self.released_number.push_back(num);
    }

    pub fn check_overlap_in_released_number(&self) {
        let set: HashSet<u16> = self.released_number.iter().cloned().collect();
        if set.len() != self.released_number.len() {
            eprintln!("Error: EnterCodeManager 중복 발생! => 시일 내 디버그 하기!");
        }
        println!("✅ EnterCodeManager: 무결성 검사 완료");
    }
}

#[derive(Deserialize, Serialize)]
#[serde(tag = "game_type", content = "game_config")]
pub enum CreateRoomRequest {
    #[serde(rename = "baduk")]
    Baduk(BadukBoardGameConfig),

    #[serde(rename = "omok")]
    Omok(BadukBoardGameConfig),
}

#[derive(Deserialize, Serialize)]
pub enum GameRomeRequest {
    Enter(UserId),
    Laeve(UserId),

}

type RoomChannelManager = Arc<RwLock<HashMap<u16, mpsc::Sender<GameRoomRequest>>>>;

pub async fn crate_room(
    State(room_channel_manager): State<RoomChannelManager>,
    State(session_storage): State<SessionStore>,
    Json(paylode): Json<CreateRoomRequest>,
) -> impl IntoResponse {
    let user_id = session_storage
        
}
*/