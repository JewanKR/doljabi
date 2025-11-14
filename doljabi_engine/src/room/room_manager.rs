use std::{collections::{HashMap, HashSet}, sync::Arc};

use axum::{Json, extract::State, response::IntoResponse};
use serde::{self, Deserialize, Serialize};
use tokio::sync::{RwLock, mpsc};
/*
pub struct EnterCodeManager {
    counter: u16,
    returned_number: HashSet<u16>,
} impl EnterCodeManager {
    pub fn new() -> Self { Self { counter: u16::max_value(), returned_number: HashSet::<u16>::new() } }

    pub fn get(&mut self) -> Result<u16, ()> {
        match self.returned_number.iter().next().cloned() {
            Some(num) => {
                self.returned_number.remove(&num);
                return Ok(num);
            }
            None => {
                if self.counter == 0 {
                    return Err(());
                }
                self.counter -= 1;
                return Ok(self.counter + 1);
            }
        }

    }
}

#[derive(Deserialize, Serialize)]
#[serde(tag = "game_type", content = "game_settings")]
pub enum RoomRequest {
    
}

#[derive(Deserialize, Serialize, Debug)]
pub enum RoomSetting {
    Baduk(BadukRequest),
    Omok(OmokRequest)
}

#[derive(Deserialize, Serialize, Debug)]
pub struct RoomChannelManager {
    room_key: Arc<RwLock<HashMap<u16, mpsc::Sender<RoomRequest>>>>
}

pub async fn crate_room(
    State(room_channel_manager): State(RoomChannelManager),
    State(session_storage): State(SessionStorage),
    Json(paylode): Json<JoinRoomRequest>,
) -> impl IntoResponse {
    let user_id = session_storage
        
}
 */