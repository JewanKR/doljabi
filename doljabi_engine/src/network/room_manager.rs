
use std::{collections::{HashMap, HashSet, VecDeque}, sync::Arc, time::Duration};
use axum::{Json, extract::State, response::IntoResponse};
use hyper::StatusCode;
use serde::{self, Deserialize, Serialize};
use tokio::sync::{Mutex, broadcast, mpsc};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};
use crate::{game::badukboard::BadukBoardGameConfig, network::{baduk_room::BadukRoom, omok_room::OmokRoom}, proto::badukboardproto::{ClientToServerRequest, ServerToClientResponse}};

pub struct RoomCommunicationDataForm {
    pub user_id: u64,
    pub client_to_server_request: Option<ClientToServerRequest>,
} impl RoomCommunicationDataForm {
    pub fn new(user_id: u64, client_to_server_request: Option<ClientToServerRequest>) -> Self { Self {
        user_id: user_id, client_to_server_request: client_to_server_request
    }}

    pub fn send(self) -> ClientToServerRequest {
        match self.client_to_server_request {
            Some(a) => a,
            None => ClientToServerRequest { session_key: "".to_string(), payload: None }
        }
    }
}

pub fn convert_game2proto_color(color: crate::game::badukboard::Color) -> crate::proto::badukboardproto::Color {
    use crate::game::badukboard::Color as GameColor;
    use crate::proto::badukboardproto::Color as ProtoColor;
    
    match color {
        GameColor::Black => ProtoColor::Black,
        GameColor::White => ProtoColor::White,
        GameColor::Free => ProtoColor::Free,
        GameColor::ColorError => ProtoColor::Error,
    }
}

#[derive(Eq, Hash, PartialEq)]
pub struct EnterCode { code : u16 }
impl EnterCode {
    fn new(code: u16) -> Self { Self { code: code }}
    pub fn as_u16(&self) -> u16 { self.code }
}

pub type RoomCommunicationChannel = (mpsc::Sender<RoomCommunicationDataForm>, broadcast::Sender<ServerToClientResponse>);

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

    fn release(&mut self, enter_code: EnterCode) {
        self.released_number.push_back(enter_code.as_u16());
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
    pub fn new() -> Self { Self {
        enter_code_management: EnterCodeManagement::new(),
        room_communication_channel_map: HashMap::<u16, RoomCommunicationChannel>::new(),
    }}

    pub fn get_enter_code(&mut self) -> Result<EnterCode, ()> {
        self.enter_code_management.get()
    }

    pub fn register_room(&mut self, enter_code: u16, room_communication_channel: RoomCommunicationChannel) {
        self.room_communication_channel_map.insert(enter_code, room_communication_channel);
    }

    pub fn release_enter_code(&mut self, enter_code: EnterCode) {
        self.room_communication_channel_map.remove(&enter_code.as_u16());
        self.enter_code_management.release(enter_code);
    }

    pub fn get_communication_channel(&self, enter_code: u16) -> Option<(mpsc::Sender<RoomCommunicationDataForm>, broadcast::Receiver<ServerToClientResponse>)> {
        let (mpsc_tx, broadcast_tx) = match self.room_communication_channel_map.get(&enter_code) {
            Some(channel) => {channel}
            None => {return None;}
        };
        Some((mpsc_tx.clone(), broadcast_tx.subscribe()))
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

#[derive(Deserialize, Serialize, ToSchema, Clone, Copy)]
pub struct CreateRoomResponseForm {
    enter_code: u16,
} impl CreateRoomResponseForm {
    pub fn new(enter_code: u16) -> Self { Self { enter_code: enter_code }}
}

pub enum RoomCore {
    Baduk(BadukRoom),
    Omok(OmokRoom),
} impl RoomCore {
    pub fn new(game_config: CreateRoomRequestForm, poweroff: mpsc::Sender<()>) -> Option<Self> {
        match game_config {
            CreateRoomRequestForm::Baduk(game_config) => Some(Self::Baduk(BadukRoom::new(game_config, poweroff))),
            CreateRoomRequestForm::Omok(game_config) => Some(Self::Omok(OmokRoom::new(game_config, poweroff))),
        }
    }
}

pub struct Room {
    enter_code: EnterCode,
    core: RoomCore,
    mpsc_rx: mpsc::Receiver<RoomCommunicationDataForm>,
    broadcast_tx: broadcast::Sender<ServerToClientResponse>,
} impl Room {
    pub fn new(
        enter_code: EnterCode,
        game_config: CreateRoomRequestForm,
        mpsc_rx: mpsc::Receiver<RoomCommunicationDataForm>,
        broadcast_tx: broadcast::Sender<ServerToClientResponse>,
        poweroff: mpsc::Sender<()>,
    ) -> Result<Self, EnterCode> {
        match RoomCore::new(game_config, poweroff) {
            Some(core) => Ok(Self {
                enter_code: enter_code,
                core: core,
    
                mpsc_rx: mpsc_rx,
                broadcast_tx: broadcast_tx
            }),
            None => Err(enter_code)
        }
    }

    pub fn delete_room(self) -> EnterCode {self.enter_code}

    pub fn input_data(&mut self, data: ClientToServerRequest) -> ServerToClientResponse {
        match &mut self.core {
            RoomCore::Baduk(_baduk_room) => {
                // baduk_room.input_data(data);
                ServerToClientResponse { response_type: false, payload: None }
            },
            RoomCore::Omok(omok_room) => {
                omok_room.input_data(data)
            },
        }
    }

    pub fn push_user(&mut self,user_id: u64) -> bool {
        match &mut self.core {
            RoomCore::Baduk(core) => {
                core.push_user(user_id)
            }
            RoomCore::Omok(core ) => {
                core.push_user(user_id)
            }
        }
    }

    pub fn pop_user(&mut self, user_id: u64) -> bool {
        match &mut self.core {
            RoomCore::Baduk(core) => {
                let result = core.pop_user(user_id);
                if core.check_emtpy_room() {let _ = core.send_poweroff();}
                result
            }
            RoomCore::Omok(core) => {
                let result = core.pop_user(user_id);
                if core.check_emtpy_room() {let _ = core.send_poweroff();}
                result
            }
        }
    }

    pub fn turn_user_id(&self) -> Option<u64> {
        match &self.core {
            RoomCore::Baduk(core) => core.turn_user_id(),
            RoomCore::Omok(core) => core.turn_user_id(),
        }
    }
}

#[utoipa::path(
    post,
    path = "/api/room/create",
    request_body = CreateRoomRequestForm,
    responses(
        (status = 201, description = "방 생성 성공", body = CreateRoomResponseForm),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "서버 오류"),
    )
)]
pub async fn create_room_request (
    State(room_manager): State<RoomManager>,
    Json(payload): Json<CreateRoomRequestForm>,
) -> impl IntoResponse {
    let (poweroff_tx, mut poweroff_rx) = mpsc::channel::<()>(1);
    let (mpsc_tx, mpsc_rx) = mpsc::channel::<RoomCommunicationDataForm>(16);
    let (broadcast_tx, _) = broadcast::channel::<ServerToClientResponse>(16);

    let (enter_code_u16, enter_code) = {
        let mut manager= room_manager.lock().await;
        let enter_code = match manager.get_enter_code() {
            Ok(code) => code,
            Err(_) => {println!("방 생성 실패: EnterCode 생성 실패"); return StatusCode::INTERNAL_SERVER_ERROR.into_response();}
        };
        manager.register_room(enter_code.as_u16(), (mpsc_tx, broadcast_tx.clone()));
        (enter_code.as_u16(), enter_code)
    };

    let mut room = match Room::new(enter_code, payload, mpsc_rx, broadcast_tx, poweroff_tx.clone()) {
        Ok(room) => room,
        Err(enter_code) => {
            let mut manager = room_manager.lock().await;
            manager.release_enter_code(enter_code);
            println!("방 생성 실패: Room 생성 실패");
            return StatusCode::BAD_REQUEST.into_response();
        } 
    };

    // room 비동기 테스크 생성 및 실행
    tokio::spawn( async move {
        let mut empty_player = true;
        // 타임 아웃 설정
        let empty_room_timeout = tokio::time::sleep(Duration::from_secs(30));
        tokio::pin!(empty_room_timeout);
        

        loop { tokio::select! {
            Some(data) = room.mpsc_rx.recv() => {
                println!("데이터 수신!");
                match &data.client_to_server_request {
                    Some(_) => {
                        if Some(data.user_id) == room.turn_user_id() {
                            let response = room.input_data(data.send());
                            let _ = room.broadcast_tx.send(response);
                        }
                    },
                    None => {
                        if room.push_user(data.user_id.clone()) {empty_player = false;}
                    }
                }
            }

            _ = poweroff_rx.recv() => {
                println!("{} 방 종료 신호 수신", room.enter_code.as_u16());
                break;
            }

            _ = (&mut empty_room_timeout), if empty_player  => {
                println!("{} 빈 방 종료", room.enter_code.as_u16());
                break;
            }
        }}

        // 테스크 종료 로직
        let release_enter_code = room.delete_room();
        {
            let mut manager = room_manager.lock().await;
            manager.release_enter_code(release_enter_code);
        }
    });

    println!("{}: 방 생성 성공", enter_code_u16);
    (StatusCode::CREATED, Json(CreateRoomResponseForm::new(enter_code_u16))).into_response()
}

pub fn create_room_router() -> OpenApiRouter<RoomManager> {
    OpenApiRouter::new().routes(routes!(create_room_request))
}