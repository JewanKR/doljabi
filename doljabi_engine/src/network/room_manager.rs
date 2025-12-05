use std::{collections::{HashMap, HashSet, VecDeque}, sync::Arc, time::Duration};
use axum::{Json, extract::State, response::IntoResponse, http::StatusCode};
use serde::{self, Deserialize, Serialize};
use tokio::{sync::{Mutex, broadcast, mpsc}, task::JoinHandle};
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

pub enum GameRoomResponse {
    ChangeTurn,
    GameOver,
    GameStart,
    None,
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
    fn input_data(&mut self, data: (u64, ClientToServerRequest)) -> (GameRoomResponse, ServerToClientResponse);
    fn check_empty_room(&self) -> bool;

    fn push_user(&mut self, user_id: u64) -> bool;
    fn pop_user(&mut self, user_id: u64) -> bool;

    fn users_info(&self) -> crate::proto::badukboardproto::UsersInfo;

    fn set_timer(&mut self) -> tokio::time::Duration;
    fn timer_interrupt(&mut self) -> (GameRoomResponse, ServerToClientResponse);
}

pub async fn run_game_node<G: GameLogic>(
    mut game: G,
    enter_code: EnterCode,
    room_manager: RoomManager,

    mut mpsc_rx: mpsc::Receiver<RoomCommunicationDataForm>,
    broadcast_tx: broadcast::Sender<Arc<ServerToClientResponse>>,
    mpsc_tx: mpsc::Sender<RoomCommunicationDataForm>
) {
    // 타임 아웃 설정
    let empty_room_timeout = tokio::time::sleep(Duration::from_secs(30));
    tokio::pin!(empty_room_timeout);
    let mut running = false;

    // 게임 타이머 설정
    let game_timer = tokio::time::sleep(Duration::from_secs(u64::MAX));
    tokio::pin!(game_timer);
    let mut timer_active = false;

    // 연결이 끊긴 플레이어 처리
    let mut disconnected_users = HashMap::<u64, JoinHandle<()>>::new();

    loop { tokio::select! {
        Some(data) = mpsc_rx.recv() => {
            #[cfg(debug_assertions)]
            println!("데이터 수신!");
            let response: ServerToClientResponse = match data {
                RoomCommunicationDataForm::Request(input_data) => {
                    let (room_response, response) = game.input_data(input_data);

                    match room_response {
                        GameRoomResponse::None => {},
                        GameRoomResponse::GameStart => {
                            running = true;
                            // 게임 시작 시 타이머 설정
                            let duration = game.set_timer();
                            game_timer.as_mut().reset(tokio::time::Instant::now() + duration);
                            timer_active = true;
                            // 게임 시작 응답을 모든 클라이언트에게 전송
                            let _ = broadcast_tx.send(Arc::new(response.clone()));
                        },
                        GameRoomResponse::GameOver => {
                            // 게임 종료 응답을 모든 클라이언트에게 전송
                            let _ = broadcast_tx.send(Arc::new(response.clone()));
                            #[cfg(debug_assertions)]
                            println!("📤 게임 종료 응답 브로드캐스트 완료");
                            break;
                        },
                        GameRoomResponse::ChangeTurn => {
                            // 턴 변경 시 타이머 재설정
                            if running && timer_active {
                                let duration = game.set_timer();
                                game_timer.as_mut().reset(tokio::time::Instant::now() + duration);
                            }
                            // 착수 응답을 모든 클라이언트에게 전송
                            let _ = broadcast_tx.send(Arc::new(response.clone()));
                        },
                    }

                    response
                },
                
                RoomCommunicationDataForm::UserEnter(user_id) => {
                    if let Some(handle) = disconnected_users.remove(&user_id) {
                        handle.abort();
                    }

                    if game.push_user(user_id) {
                        ServerToClientResponse {
                            response_type: true,
                            turn: crate::proto::badukboardproto::Color::Free as i32,
                            the_winner: None,
                            game_state: None,
                            users_info: Some(game.users_info()),
                            payload: None,
                        }
                    } else {
                        ServerToClientResponse {
                            response_type: false,
                            turn: crate::proto::badukboardproto::Color::Free as i32,
                            the_winner: None,
                            game_state: None,
                            users_info: None,
                            payload: None,
                        }
                    }
                },

                RoomCommunicationDataForm::UserDisconnect(user_id) => {
                    use crate::proto::badukboardproto::{client_to_server_request::Payload, ResignRequest};
                    if running {
                        // 게임 시작 후 > 60초 타이머 시작
                        let tx_clone = mpsc_tx.clone();
                        let disconnected_user_task = tokio::spawn(async move{
                            tokio::time::sleep(Duration::from_secs(60)).await;
                            let _ = tx_clone.send(
                                RoomCommunicationDataForm::Request((
                                    user_id,
                                    ClientToServerRequest{
                                        session_key: "".to_string(),
                                        payload: Some(Payload::Resign(ResignRequest{})),
                                    }
                                )
                            )).await;
                        });
                        disconnected_users.insert(user_id, disconnected_user_task);
                        continue;
                    } else {
                        // 게임 시작 전 > 방 나가기
                        game.pop_user(user_id);
                        if game.check_empty_room() {break;}
                        ServerToClientResponse {
                            response_type: true,
                            turn: crate::proto::badukboardproto::Color::Free as i32,
                            the_winner: None,
                            game_state: None,
                            users_info: Some(game.users_info()),
                            payload: None,
                        }
                    }
                }
            };

            let _ = broadcast_tx.send(Arc::new(response));
        }

        _ = &mut game_timer, if running && timer_active => {
            // 타이머 만료 처리
            let (room_response, response) = game.timer_interrupt();
            
            match room_response {
                GameRoomResponse::None => {
                    // 타이머가 계속 동작해야 하는 경우 (시간 감소만)
                    let duration = game.set_timer();
                    game_timer.as_mut().reset(tokio::time::Instant::now() + duration);
                    let _ = broadcast_tx.send(Arc::new(response));
                },
                GameRoomResponse::GameOver => {
                    // 시간 초과로 게임 종료
                    let _ = broadcast_tx.send(Arc::new(response));
                    break;
                },
                _ => {
                    let _ = broadcast_tx.send(Arc::new(response));
                }
            }
        }

        _ = &mut empty_room_timeout, if game.check_empty_room() => {
            //#[cfg(debug_assertions)]
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
    let (mpsc_tx, mpsc_rx) = mpsc::channel::<RoomCommunicationDataForm>(16);
    let (broadcast_tx, _) = broadcast::channel::<Arc<ServerToClientResponse>>(16);

    let tx_clone = mpsc_tx.clone();

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
            // 초를 밀리초로 변환 (프론트엔드는 초 단위로 보냄)
            let (main_time, fischer_time, remaining_overtime, overtime) = config.output();
            let config_ms = BadukBoardGameConfig::new(
                main_time,
                fischer_time,
                remaining_overtime,
                overtime
            );
            let game = BadukRoom::new(config_ms);
            tokio::spawn(run_game_node(game, enter_code, manager, mpsc_rx, broadcast_tx, tx_clone));
        }
        CreateRoomRequestForm::Omok(config) => {
            // 초를 밀리초로 변환 (프론트엔드는 초 단위로 보냄)
            let (main_time, fischer_time, remaining_overtime, overtime) = config.output();
            let config_ms = BadukBoardGameConfig::new(
                main_time,
                fischer_time,
                remaining_overtime,
                overtime
            );
            let game = OmokRoom::new(config_ms);
            tokio::spawn(run_game_node(game, enter_code, manager, mpsc_rx, broadcast_tx, tx_clone));
        }
    };

    #[cfg(debug_assertions)]
    println!("{}: 방 생성 성공", enter_code_u16);

    (StatusCode::CREATED, Json(CreateRoomResponseForm::new(enter_code_u16))).into_response()
}

pub fn create_room_router() -> OpenApiRouter<RoomManager> {
    OpenApiRouter::new().routes(routes!(create_room_request))
}
