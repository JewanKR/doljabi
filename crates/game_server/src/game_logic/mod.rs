use std::{
    collections::{HashMap, HashSet, VecDeque},
    sync::{Arc, atomic::AtomicU16},
};

use axum::{Json, extract::State, response::IntoResponse};
use doljabiproto::common::{ClientToServer, ServerToClient};
use game_core::{UserID, baduk_board::BadukBoardGameConfig};
use hyper::StatusCode;
use serde::{Deserialize, Serialize};
use tokio::sync::{Mutex, broadcast, mpsc};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::game_logic::{
    baduk_board::baduk_room::BadukRoom,
    timer::{GameInterrupter, TimerManager},
};

pub mod baduk_board;
pub mod timer;

#[derive(Hash, PartialEq, Eq)]
pub struct EnterCode {
    code: u16,
}
impl EnterCode {
    fn new(code: u16) -> Self {
        Self { code: code }
    }
    pub fn as_u16(&self) -> u16 {
        self.code
    }
}

#[derive(Clone, Debug)]
pub enum SystemEvent {
    TimerInterrupt(Arc<AtomicU16>),
    EnterUser(UserID),
    LeaveUser(UserID),
    Close,
}

#[derive(Clone, Debug)]
pub enum InputMessage {
    System(SystemEvent),
    Request((UserID, ClientToServer)),
}

pub trait GameLogic: Send + Sync {
    fn send(&mut self, user_id: UserID, message: ClientToServer) -> ServerToClient;
    fn enter_user(&mut self, user_id: UserID) -> ServerToClient;
    fn leave_user(&mut self, user_id: UserID) -> ServerToClient;
    fn timer_interrupt(&mut self, event: u16) -> ServerToClient;
}

pub struct RoomChannels {
    input: mpsc::Sender<InputMessage>,
    output: broadcast::Sender<Arc<ServerToClient>>,
}

pub struct EnterCodeManagement {
    counter: u16,
    released_number: VecDeque<u16>,
}

impl EnterCodeManagement {
    fn new() -> Self {
        Self {
            counter: u16::MAX,
            released_number: VecDeque::<u16>::from([u16::MAX]),
        }
    }

    fn get(&mut self) -> Option<EnterCode> {
        match self.released_number.pop_front() {
            Some(num) => Some(EnterCode::new(num)),
            None => match self.counter.checked_sub(1) {
                Some(num) => {
                    self.counter = num;
                    Some(EnterCode::new(num))
                }
                None => None,
            },
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
    room_channels_list: HashMap<u16, RoomChannels>,
}
impl RoomManagement {
    pub fn new() -> Self {
        Self {
            enter_code_management: EnterCodeManagement::new(),
            room_channels_list: HashMap::<u16, RoomChannels>::new(),
        }
    }

    pub fn get_enter_code(&mut self) -> Option<EnterCode> {
        self.enter_code_management.get()
    }

    pub fn register_room(&mut self, enter_code: u16, room_channels: RoomChannels) {
        self.room_channels_list.insert(enter_code, room_channels);
    }

    pub fn release_enter_code(&mut self, enter_code: EnterCode) {
        self.room_channels_list.remove(&enter_code.as_u16());
        self.enter_code_management.release(enter_code);
    }

    pub fn get_channels(
        &self,
        enter_code: u16,
    ) -> Option<(
        mpsc::Sender<InputMessage>,
        broadcast::Receiver<Arc<ServerToClient>>,
    )> {
        match self.room_channels_list.get(&enter_code) {
            Some(channel) => Some((channel.input.clone(), channel.output.subscribe())),
            None => None,
        }
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
}
impl CreateRoomResponseForm {
    pub fn new(enter_code: u16) -> Self {
        Self {
            enter_code: enter_code,
        }
    }
}

pub async fn run_game_node<G: GameLogic>(
    mut game: G,
    enter_code: EnterCode,
    room_manager: RoomManager,

    mut mpsc_rx: mpsc::Receiver<InputMessage>,
    broadcast_tx: broadcast::Sender<Arc<ServerToClient>>,
) {
    while let Some(input_message) = mpsc_rx.recv().await {
        #[cfg(debug_assertions)]
        println!("{:#?}", input_message);
        let _ = broadcast_tx.send(Arc::new(match input_message {
            InputMessage::Request((user_id, message)) => game.send(user_id, message),
            InputMessage::System(SystemEvent::EnterUser(user_id)) => game.enter_user(user_id),
            InputMessage::System(SystemEvent::LeaveUser(user_id)) => game.leave_user(user_id),
            InputMessage::System(SystemEvent::TimerInterrupt(event_id)) => {
                match event_id.load(std::sync::atomic::Ordering::Relaxed) {
                    0 => continue,
                    event => game.timer_interrupt(event),
                }
            }
            InputMessage::System(SystemEvent::Close) => break,
        }));
    }

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
pub async fn create_room_request(
    State((room_manager, timer_manager)): State<(RoomManager, TimerManager)>,
    Json(payload): Json<CreateRoomRequestForm>,
) -> impl IntoResponse {
    let (mpsc_tx, mpsc_rx) = mpsc::channel::<InputMessage>(32);
    let (broadcast_tx, _) = broadcast::channel::<Arc<ServerToClient>>(32);

    let game_timer = GameInterrupter {
        sender: timer_manager.clone(),
        receiver: mpsc_tx.clone(),
    };

    let (enter_code_u16, enter_code) = {
        let mut manager = room_manager.lock().await;
        let enter_code = match manager.get_enter_code() {
            Some(code) => code,
            None => {
                eprintln!("방 생성 실패: EnterCode 생성 실패");
                return StatusCode::INTERNAL_SERVER_ERROR.into_response();
            }
        };
        manager.register_room(
            enter_code.as_u16(),
            RoomChannels {
                input: mpsc_tx,
                output: broadcast_tx.clone(),
            },
        );
        (enter_code.as_u16(), enter_code)
    };

    let manager = room_manager.clone();

    let game = match payload {
        CreateRoomRequestForm::Baduk(config) => BadukRoom::new(config, game_timer),
        CreateRoomRequestForm::Omok(config) => BadukRoom::new(config, game_timer),
    };

    tokio::spawn(run_game_node(
        game,
        enter_code,
        manager,
        mpsc_rx,
        broadcast_tx,
    ));

    #[cfg(debug_assertions)]
    println!("{}: 방 생성 성공", enter_code_u16);

    (
        StatusCode::CREATED,
        Json(CreateRoomResponseForm::new(enter_code_u16)),
    )
        .into_response()
}

pub fn create_room_router() -> OpenApiRouter<(RoomManager, TimerManager)> {
    OpenApiRouter::new().routes(routes!(create_room_request))
}
