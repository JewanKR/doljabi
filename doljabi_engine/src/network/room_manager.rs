/*
use std::{collections::{HashMap, HashSet, VecDeque}, sync::Arc};
use serde::{self, Deserialize, Serialize};
use tokio::sync::{Mutex, broadcast, mpsc};
use utoipa::ToSchema;
use crate::{game::badukboard::BadukBoardGameConfig, network::{baduk_room::BadukRoom, omok_room::OmokRoom}, proto::badukboardproto::{ClientToServerRequest, ServerToClientResponse}};

#[derive(Eq, Hash, PartialEq)]
pub struct EnterCode { code : u16 }
impl EnterCode {
    fn new(code: u16) -> Self { Self { code: code }}
    pub fn as_u16(&self) -> u16 { self.code }
}

pub type RoomCommunicationChannel = (mpsc::Sender<ClientToServerRequest>, broadcast::Receiver<ServerToClientResponse>);

pub struct EnterCodeManagement {
    counter: u16,
    released_number: VecDeque<u16>,
} impl EnterCodeManagement {
    fn new() -> Self { Self { counter: u16::MAX, released_number: VecDeque::<u16>::from([u16::MAX]) } }

    fn get(&mut self) -> Result<EnterCode, ()> {
        match self.released_number.pop_front() {
            Some(num) => Ok(EnterCode::new(num)),
            None => { match self.counter.checked_sub(1) {
                Some(num) => {self.counter = num; Ok(EnterCode::new(num))},
                None => Err(())
            }}
        }
    }

    fn release(&mut self, num: EnterCode) {
        self.released_number.push_back(num.as_u16());
    }

    pub fn check_overlap_in_released_number(&self) {
        let set: HashSet<u16> = self.released_number.iter().cloned().collect();
        if set.len() != self.released_number.len() {
            eprintln!("Error: EnterCodeManagement 중복 발생! => 시일 내 디버그 하기!");
        }
        println!("✅ EnterCodeManagement: 무결성 검사 완료");
    }
}

pub struct RoomManagement {
    enter_code_management: EnterCodeManagement,
    room_communication_channel_map: HashMap<u16, RoomCommunicationChannel>,
} impl RoomManagement {
    fn new() -> Self { Self {
        enter_code_management: EnterCodeManagement::new(),
        room_communication_channel_map: HashMap::<u16, RoomCommunicationChannel>::new(),
    }}

    pub fn get_enter_code(&mut self) -> Result<EnterCode, ()> {
        self.enter_code_management.get()
    }

    pub fn register_room(&mut self, enter_code: u16, room_communication_channel: RoomCommunicationChannel) {
        self.room_communication_channel_map.insert(enter_code, room_communication_channel);
    }

    pub fn delete_room(&mut self, enter_code: EnterCode) {
        self.room_communication_channel_map.remove(&enter_code.as_u16());
        self.enter_code_management.release(enter_code);
    }
}

pub type RoomManager = Arc<Mutex<RoomManagement>>;

#[derive(Deserialize, Serialize, ToSchema, Clone, Copy)]
#[serde(tag = "game_type", content = "game_config")]
pub enum CreateRoomRequestForm {
    #[serde(rename = "baduk")]
    Baduk(BadukBoardGameConfig),

    #[serde(rename = "omok")]
    Omok(BadukBoardGameConfig),
}

pub enum RoomCore {
    Baduk(BadukRoom),
    Omok(OmokRoom),
} impl RoomCore {
    pub fn new(game_config: CreateRoomRequestForm) -> Self {
        match game_config {
            CreateRoomRequestForm::Baduk(game_config) => Self::Baduk(BadukRoom::new(game_config)),
            CreateRoomRequestForm::Omok(game_config) => Self::Omok(OmokRoom::new(game_config)),
        }
    }
}

pub struct Room {
    enter_code: EnterCode,
    core: RoomCore,
    mpsc_rx: mpsc::Receiver<ClientToServerRequest>,
    broadcast_tx: broadcast::Sender<ServerToClientResponse>,

} impl Room {
    pub fn new(
        enter_code: EnterCode,
        game_config: CreateRoomRequestForm,
        mpsc_rx: mpsc::Receiver<ClientToServerRequest>,
        broadcast_tx: broadcast::Sender<ServerToClientResponse>,
    ) -> Self { Self {
        enter_code: enter_code,
        core: RoomCore::new(game_config),

        mpsc_rx: mpsc_rx,
        broadcast_tx: broadcast_tx,
    }}
}


#[utoipa::path(
    post,
    path = "api/game/create",
    request_body = CreateRoomRequestForm,
    responses(
        (status = 201, description = "방 생성 성공", body = CreateRoomResponse),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "서버 오류"),
    )
)]
pub async fn crate_room_request (
    State(room_manager): State<RoomManager>,
    Json(paylode): Json<CreateRoomRequestForm>,
) -> impl IntoResponse {
    let (poweroff_tx, mut poweroff_rx) = oneshot::channel::<()>();
    let (mpsc_tx, mut mpsc_rx) = mpsc::channel::<ClientToServerRequest>(1024);
    let (broadcast_tx, mut broadcast_rx) = broadcast::channel::<ServerToClientResponse>(1024);

    let (enter_code, enter_code_u16) = {
        let manager= room_manager.lock().await;
        let enter_code = match manager.get_enter_code(){
            Ok(code) => code,
            Err(_) => {return StatusCode::INTERNAL_SERVER_ERROR;}
        };
        manager.register_room(enter_code.as_u16(), (mpsc_tx, broadcast_rx));
        (enter_code, enter_code.as_u16())
    };
    
    let room_tash = tokio::spawn( async move {
        let empty_room_timeout = Some(tokio::time::sleep(
            std::time::Duration::from_secs(30)
        ));
    
        loop {
            tokio::select! {

                _ = &mut poweroff_rx => {
                    println!("{} 방 종료 신호 수신", enter_code);
                    break;
                }
        
                // empty room timeout
                _ = async {
                    match &mut empty_room_timeout {
                        Some(sleep) => sleep.await,
                        None => std::future::pending().await,
                    }
                } => {
                    println!("빈 방 {} 타임아웃으로 종료", enter_code);
                    break;
                }
            }
        }
    })

    (StatusCode::CREATED, Json(CreateRoomRequestForm {
        enter_code: enter_code_u16
    })).into_response()
}
*/