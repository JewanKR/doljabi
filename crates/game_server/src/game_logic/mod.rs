use game_core::GameLogic;

pub mod baduk_board;

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

pub type RoomCommunicationChannel = (
    mpsc::Sender<RoomCommunicationDataForm>,
    broadcast::Sender<Arc<ServerToClientResponse>>,
);

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
    room_communication_channel_map: HashMap<u16, RoomCommunicationChannel>,
}
impl RoomManagement {
    pub fn new() -> Self {
        Self {
            enter_code_management: EnterCodeManagement::new(),
            room_communication_channel_map: HashMap::<u16, RoomCommunicationChannel>::new(),
        }
    }

    pub fn get_enter_code(&mut self) -> Option<EnterCode> {
        self.enter_code_management.get()
    }

    pub fn register_room(
        &mut self,
        enter_code: u16,
        room_communication_channel: RoomCommunicationChannel,
    ) {
        self.room_communication_channel_map
            .insert(enter_code, room_communication_channel);
    }

    pub fn release_enter_code(&mut self, enter_code: EnterCode) {
        self.room_communication_channel_map
            .remove(&enter_code.as_u16());
        self.enter_code_management.release(enter_code);
    }

    pub fn get_communication_channel(
        &self,
        enter_code: u16,
    ) -> Option<(
        mpsc::Sender<RoomCommunicationDataForm>,
        broadcast::Receiver<Arc<ServerToClientResponse>>,
    )> {
        let (mpsc_tx, broadcast_tx) = match self.room_communication_channel_map.get(&enter_code) {
            Some(channel) => channel,
            None => {
                return None;
            }
        };
        Some((mpsc_tx.clone(), broadcast_tx.subscribe()))
    }
}

pub type RoomManager = Arc<Mutex<RoomManagement>>;

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

// TODO: 총체적 난국...
// GameLogic 을 이용해서 분리를 해야하는데...
// 어디서 부터 해야히지?
// 일단 외부로 출력하던 모든 데이터들을 GameLogic 의 Input, Output 형식으로 바꾸고
// crate room reqeust 를 지금 만는 game_core 형식에 맞게 수정해야함.
// 아마 그것 말고 해야하는게 더 있을 것 같음...
// 내일의 나에게 맏긴다!

pub async fn run_game_node<G: GameLogic>(
    mut game: G,
    enter_code: EnterCode,
    room_manager: RoomManager,

    mut mpsc_rx: mpsc::Receiver<G::Input>,
    broadcast_tx: broadcast::Sender<Arc<G::Output>>,
    mpsc_tx: mpsc::Sender<RoomCommunicationDataForm>,
) {
    // 연결이 끊긴 플레이어 처리
    let mut disconnected_users = HashMap::<u64, JoinHandle<()>>::new();

    while let Some(message) = mpsc_rx.recv() {
        let _ = broadcast_tx.send(Arc::new(game.send(game::Input::from(message))));
    }

    /* 폐기 예정
    loop {
        tokio::select! {
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
                                game_timer.as_mut().reset(tokio::time::Instant::now() + (duration));
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
                                turn: doljabiproto::badukboard::Color::Free as i32,
                                the_winner: None,
                                game_state: None,
                                users_info: Some(game.users_info()),
                                payload: None,
                            }
                        } else {
                            ServerToClientResponse {
                                response_type: false,
                                turn: doljabiproto::badukboard::Color::Free as i32,
                                the_winner: None,
                                game_state: None,
                                users_info: None,
                                payload: None,
                            }
                        }
                    },

                    RoomCommunicationDataForm::UserDisconnect(user_id) => {
                        use doljabiproto::badukboard::{client_to_server_request::Payload, ResignRequest};
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
                                turn: doljabiproto::badukboard::Color::Free as i32,
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
                        let _ = broadcast_tx.send(Arc::new(response.clone()));
                    },
                    GameRoomResponse::GameOver => {
                        // 시간 초과로 게임 종료
                        let duration = game.set_timer();
                        game_timer.as_mut().reset(tokio::time::Instant::now() + duration);

                        let _ = broadcast_tx.send(Arc::new(response.clone()));
                        break;
                    },
                    _ => {
                        let _ = broadcast_tx.send(Arc::new(response.clone()));
                        break;
                    }
                }
            }

            _ = &mut empty_room_timeout, if game.check_empty_room() => {
                //#[cfg(debug_assertions)]
                println!("{} 빈 방 삭제", enter_code.as_u16());
                break;
            }
        }
    }
    */

    let mut manager = room_manager.lock().await;
    manager.release_enter_code(enter_code);

    //#[cfg(debug_assertions)]
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
pub async fn create_room_request<G: GameLogic>(
    State(room_manager): State<RoomManager>,
    Json(payload): Json<CreateRoomRequestForm>,
) -> impl IntoResponse {
    let (mpsc_tx, mpsc_rx) = mpsc::channel::<RoomCommunicationDataForm>(16);
    let (broadcast_tx, _) = broadcast::channel::<Arc<ServerToClientResponse>>(16);

    let tx_clone = mpsc_tx.clone();

    let (enter_code_u16, enter_code) = {
        let mut manager = room_manager.lock().await;
        let enter_code = match manager.get_enter_code() {
            Some(code) => code,
            None => {
                println!("방 생성 실패: EnterCode 생성 실패");
                return StatusCode::INTERNAL_SERVER_ERROR.into_response();
            }
        };
        manager.register_room(enter_code.as_u16(), (mpsc_tx, broadcast_tx.clone()));
        (enter_code.as_u16(), enter_code)
    };

    let manager = room_manager.clone();

    match payload {
        CreateRoomRequestForm::Baduk(config) => {
            // 초를 밀리초로 변환 (프론트엔드는 초 단위로 보냄)
            let (main_time, fischer_time, remaining_overtime, overtime) = config.output();
            let config_ms =
                BadukBoardGameConfig::new(main_time, fischer_time, remaining_overtime, overtime);
            let game = BadukRoom::new(config_ms);
            tokio::spawn(run_game_node(
                game,
                enter_code,
                manager,
                mpsc_rx,
                broadcast_tx,
                tx_clone,
            ));
        }
        CreateRoomRequestForm::Omok(config) => {
            // 초를 밀리초로 변환 (프론트엔드는 초 단위로 보냄)
            let (main_time, fischer_time, remaining_overtime, overtime) = config.output();
            let config_ms =
                BadukBoardGameConfig::new(main_time, fischer_time, remaining_overtime, overtime);
            let game = OmokRoom::new(config_ms);
            tokio::spawn(run_game_node(
                game,
                enter_code,
                manager,
                mpsc_rx,
                broadcast_tx,
                tx_clone,
            ));
        }
    };

    #[cfg(debug_assertions)]
    println!("{}: 방 생성 성공", enter_code_u16);

    (
        StatusCode::CREATED,
        Json(CreateRoomResponseForm::new(enter_code_u16)),
    )
        .into_response()
}

pub fn create_room_router() -> OpenApiRouter<RoomManager> {
    OpenApiRouter::new().routes(routes!(create_room_request))
}
