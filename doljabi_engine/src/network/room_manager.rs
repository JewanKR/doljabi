use std::{collections::{HashMap, HashSet, VecDeque}, sync::Arc, time::Duration};
use axum::{Json, extract::State, response::IntoResponse, http::StatusCode};
use serde::{self, Deserialize, Serialize};
use tokio::sync::{Mutex, broadcast, mpsc, oneshot};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};
use crate::{game::badukboard::BadukBoardGameConfig, network::{baduk_room::BadukRoom, omok_room::OmokRoom, socket::RoomCommunicationDataForm}, proto::badukboardproto::{ClientToServerRequest, ServerToClientResponse}};

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

pub type RoomCommunicationChannel = (mpsc::Sender<RoomCommunicationDataForm>, broadcast::Sender<Arc<ServerToClientResponse>>);

pub struct EnterCodeManagement {
    counter: u16,
    released_number: VecDeque<u16>,
} impl EnterCodeManagement {
    fn new() -> Self { Self { counter: u16::MAX, released_number: VecDeque::<u16>::from([u16::MAX]) } }

    fn get(&mut self) -> Option<EnterCode> {
        match self.released_number.pop_front() {
            Some(num) => Some(EnterCode::new(num)),
            None => { match self.counter.checked_sub(1) {
                Some(num) => {self.counter = num; Some(EnterCode::new(num))},
                None => None
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

    pub fn get_enter_code(&mut self) -> Option<EnterCode> {
        self.enter_code_management.get()
    }

    pub fn register_room(&mut self, enter_code: u16, room_communication_channel: RoomCommunicationChannel) {
        self.room_communication_channel_map.insert(enter_code, room_communication_channel);
    }

    pub fn release_enter_code(&mut self, enter_code: EnterCode) {
        self.room_communication_channel_map.remove(&enter_code.as_u16());
        self.enter_code_management.release(enter_code);
    }

    pub fn get_communication_channel(&self, enter_code: u16) -> Option<(mpsc::Sender<RoomCommunicationDataForm>, broadcast::Receiver<Arc<ServerToClientResponse>>)> {
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

pub trait GameLogic: Send + Sync {
    fn input_data(&mut self, data: RoomCommunicationDataForm) -> Option<ServerToClientResponse>;
    fn check_emtpy_room(&self) -> bool;
}

pub async fn run_game_node<G: GameLogic>(
    mut game: G,
    enter_code: EnterCode,
    room_manager: RoomManager,

    mut mpsc_rx: mpsc::Receiver<RoomCommunicationDataForm>,
    broadcast_tx: broadcast::Sender<Arc<ServerToClientResponse>>,
    mut poweroff_rx: mpsc::Receiver<()>
) {
    // 타임 아웃 설정
    let mut empty_room_timeout = tokio::time::interval(Duration::from_secs(30));
    let _ = empty_room_timeout.tick();

    loop { tokio::select! {
        Some(data) = mpsc_rx.recv() => {
            #[cfg(debug_assertions)]
            println!("데이터 수신!");
            let response: ServerToClientResponse = match game.input_data(data) {
                Some(response) => response,
                None => {continue;}
            };
            let _ = broadcast_tx.send(Arc::new(response));
        }

        _ = poweroff_rx.recv() => {
            #[cfg(debug_assertions)]
            println!("{} 방 종료 신호 수신", enter_code.as_u16());
            break;
        }

        _ = empty_room_timeout.tick(), if game.check_emtpy_room() => {
            #[cfg(debug_assertions)]
            println!("{} 빈 방 삭제", enter_code.as_u16());
            break;
        }
    }}

    let mut manager = room_manager.lock().await;
    manager.release_enter_code(enter_code);

    #[cfg(debug_assertions)]
    println!("방 종료 성공");
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
    let (poweroff_tx, poweroff_rx) = mpsc::channel::<()>(1);
    let (mpsc_tx, mpsc_rx) = mpsc::channel::<RoomCommunicationDataForm>(16);
    let (broadcast_tx, _) = broadcast::channel::<Arc<ServerToClientResponse>>(16);

    let (enter_code_u16, enter_code) = {
        let mut manager= room_manager.lock().await;
        let enter_code = match manager.get_enter_code() {
            Some(code) => code,
            None => {println!("방 생성 실패: EnterCode 생성 실패"); return StatusCode::INTERNAL_SERVER_ERROR.into_response();}
        };
        manager.register_room(enter_code.as_u16(), (mpsc_tx, broadcast_tx.clone()));
        (enter_code.as_u16(), enter_code)
    };

    let manager = room_manager.clone();

    match payload {
        CreateRoomRequestForm::Baduk(config) => {
            let game = BadukRoom::new(config, poweroff_tx);
            run_game_node(game, enter_code, manager, mpsc_rx, broadcast_tx, poweroff_rx);
        }
        CreateRoomRequestForm::Omok(config) => {
            let game = OmokRoom::new(config, poweroff_tx);
            run_game_node(game, enter_code, manager, mpsc_rx, broadcast_tx, poweroff_rx);
        }
    };

    #[cfg(debug_assertions)]
    println!("{}: 방 생성 성공", enter_code_u16);

    (StatusCode::CREATED, Json(CreateRoomResponseForm::new(enter_code_u16))).into_response()
}

pub fn create_room_router() -> OpenApiRouter<RoomManager> {
    OpenApiRouter::new().routes(routes!(create_room_request))
}
