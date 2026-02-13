use crate::{
    game::{
        badukboard::{BadukBoardGameConfig, Color, Players},
        omok::Omok,
    },
    network::room_manager::{GameLogic, GameRoomResponse, convert_game2proto_color},
    proto::badukboardproto::{
        ClientToServer, GameStartResponse, ServerToClient, server_to_client_response,
    },
};

pub struct OmokRoom {
    running: bool,
    game: Omok,
    game_config: BadukBoardGameConfig,
    players: Players,
}
impl OmokRoom {
    pub fn new(game_config: BadukBoardGameConfig) -> Self {
        Self {
            running: false,
            game: Omok::new(),
            game_config: game_config,
            players: Players::new(),
        }
    }

    pub fn turn_user_id(&self) -> Option<u64> {
        let color = self.game.board.is_turn();
        self.players.user_id(color)
    }

    pub fn set_players_time(&mut self, config: &BadukBoardGameConfig) -> bool {
        if !self.players.full_players() {
            return false;
        }
        self.players.set_players(&config);

        true
    }

    pub fn baduk_board_state(&self) -> doljabiproto::badukboard::BadukBoardState {
        use doljabiproto::badukboard::BadukBoardState;

        BadukBoardState {
            black: self.game.board.bitboard_black().to_vec(),
            white: self.game.board.bitboard_white().to_vec(),
        }
    }

    pub fn user_info(&self, color: Color) -> Option<doljabiproto::badukboard::UserInfo> {
        use crate::soyul::soyul_login::get_user_profile_by_id;
        use rusqlite::Connection;

        let conn = match Connection::open("mydb.db") {
            Ok(conn) => conn,
            Err(e) => {
                eprintln!("game_user_info 출력 에러: DB 불러오기 실패: {}", e);
                return None;
            }
        };

        match color {
            Color::Black => {
                if let Some(player) = &self.players.black_player {
                    if let Ok(Some(user_profile)) = get_user_profile_by_id(&conn, player.user_id())
                    {
                        Some(user_profile.convert_session2proto())
                    } else {
                        eprintln!("user_info: 존재하지 않는 유저 정보!");
                        None
                    }
                } else {
                    None
                }
            }
            Color::White => {
                if let Some(player) = &self.players.white_player {
                    if let Ok(Some(user_profile)) = get_user_profile_by_id(&conn, player.user_id())
                    {
                        Some(user_profile.convert_session2proto())
                    } else {
                        eprintln!("user_info: 존재하지 않는 유저 정보!");
                        None
                    }
                } else {
                    None
                }
            }
            _ => None,
        }
    }

    pub fn black_player_time_info(&self) -> doljabiproto::badukboard::PlayerTimeInfo {
        use doljabiproto::badukboard::PlayerTimeInfo;

        let player_state = match self.players.black_player_state() {
            Some(player) => player.output(),
            None => BadukBoardGameConfig::empty().output(),
        };

        PlayerTimeInfo {
            main_time: player_state.0,
            fischer_time: player_state.1,
            remaining_overtime: player_state.2 as u32,
            overtime: player_state.3,
        }
    }

    pub fn white_player_time_info(&self) -> doljabiproto::badukboard::PlayerTimeInfo {
        use doljabiproto::badukboard::PlayerTimeInfo;

        let player_state = match self.players.white_player_state() {
            Some(player) => player.output(),
            None => BadukBoardGameConfig::empty().output(),
        };

        PlayerTimeInfo {
            main_time: player_state.0,
            fischer_time: player_state.1,
            remaining_overtime: player_state.2 as u32,
            overtime: player_state.3,
        }
    }

    pub fn badukboard_status(&self) -> doljabiproto::badukboard::GameState {
        doljabiproto::badukboard::GameState {
            board: Some(self.baduk_board_state()),
            black_time: Some(self.black_player_time_info()),
            white_time: Some(self.white_player_time_info()),
        }
    }

    pub fn record_winner(&mut self, color: Color) {
        use crate::soyul::soyul_login::{record_game_draw, record_game_lose, record_game_win};

        let black_player_id = self
            .players
            .black_player
            .as_ref()
            .map(|bp| bp.user_id())
            .unwrap_or(u64::MAX);
        let white_player_id = self
            .players
            .white_player
            .as_ref()
            .map(|wp| wp.user_id())
            .unwrap_or(u64::MAX);

        match color {
            Color::Black => {
                let _ = record_game_win(black_player_id);
                let _ = record_game_lose(white_player_id);
            }
            Color::White => {
                let _ = record_game_lose(black_player_id);
                let _ = record_game_win(white_player_id);
            }
            Color::Free => {
                let _ = record_game_draw(black_player_id);
                let _ = record_game_draw(white_player_id);
            }
            _ => {}
        }
    }
}

impl GameLogic for OmokRoom {
    fn check_empty_room(&self) -> bool {
        self.players.check_empty_room()
    }

    fn push_user(&mut self, user_id: u64) -> bool {
        self.players.push_user(user_id)
    }

    fn pop_user(&mut self, user_id: u64) -> bool {
        self.players.pop_user(user_id)
    }

    fn users_info(&self) -> doljabiproto::badukboard::UsersInfo {
        doljabiproto::badukboard::UsersInfo {
            black: self.user_info(Color::Black),
            white: self.user_info(Color::White),
        }
    }

    fn set_timer(&mut self) -> tokio::time::Duration {
        use tokio::time::Duration;
        let turn_player = self.players.turn_player(self.game.board.is_turn());

        match turn_player {
            Some(p) => {
                if p.main_time() > 0 {
                    Duration::from_millis(p.main_time())
                } else if p.remain_time() > 0 {
                    Duration::from_millis(p.overtime())
                } else {
                    self.game.set_winner(self.game.board.is_turn().reverse());
                    Duration::from_secs(12614400000)
                }
            }
            None => Duration::from_secs(12614400000),
        }
    }

    fn timer_interrupt(&mut self) -> (GameRoomResponse, ServerToClient) {
        let turn_player = self.players.turn_player_mut(self.game.board.is_turn());

        match turn_player {
            Some(p) => {
                if p.main_time() > 0 {
                    p.sub_main_time();
                    self.set_timer();
                    (
                        GameRoomResponse::None,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                            the_winner: None,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: None,
                        },
                    )
                } else if p.remain_time() > 1 {
                    p.sub_remain_overtime();
                    self.set_timer();
                    (
                        GameRoomResponse::None,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                            the_winner: None,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: None,
                        },
                    )
                } else {
                    self.game.set_winner(self.game.board.is_turn().reverse());
                    self.record_winner(self.game.board.is_turn().reverse());
                    self.set_timer();

                    (
                        GameRoomResponse::GameOver,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                            the_winner: self
                                .game
                                .winner()
                                .map(|w| convert_game2proto_color(w.clone()) as i32),
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: None,
                        },
                    )
                }
            }
            None => (
                GameRoomResponse::None,
                ServerToClient {
                    response_type: false,
                    turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                    game_state: None,
                    users_info: None,
                    the_winner: None,
                    payload: None,
                },
            ),
        }
    }

    fn input_data(
        &mut self,
        input_data: (u64, ClientToServer),
    ) -> (GameRoomResponse, ServerToClient) {
        use doljabiproto::badukboard::client_to_server_request::Payload;

        let (user_id, request) = input_data;

        let mut response = (
            GameRoomResponse::None,
            ServerToClient {
                response_type: false,
                turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                the_winner: None,
                game_state: None,
                users_info: None,
                payload: None,
            },
        );

        // 게임 시작 요청 처리
        if let Some(Payload::Gamestart(_)) = &request.payload {
            // 플레이어가 모두 접속 중인지 확인
            if self.players.full_players() {
                self.running = true;
                self.set_players_time(&self.game_config.clone());

                use doljabiproto::badukboard::UsersInfo;
                response = (
                    GameRoomResponse::GameStart,
                    ServerToClient {
                        response_type: true,
                        turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                        the_winner: None,
                        game_state: Some(self.badukboard_status()),
                        users_info: Some(UsersInfo {
                            black: self.user_info(Color::Black),
                            white: self.user_info(Color::White),
                        }),
                        payload: Some(server_to_client_response::Payload::GameStart(
                            GameStartResponse {},
                        )),
                    },
                )
            }
        }

        if self.running {
            match request.payload {
                Some(Payload::Coordinate(chaksu_request)) => {
                    use doljabiproto::badukboard::ChaksuResponse;
                    let turn = self.game.is_board().is_turn();
                    let mut game_room_status = GameRoomResponse::None;

                    #[cfg(debug_assertions)]
                    println!(
                        "🎯 착수 요청: user_id={}, coordinate={}, 현재 턴={:?}",
                        user_id, chaksu_request.coordinate, turn
                    );

                    // 착수를 시도하는 사람의 턴인지 확인
                    let player_color = self.players.check_id_to_color(user_id);
                    #[cfg(debug_assertions)]
                    println!("플레이어 색상: {:?}, 현재 턴: {:?}", player_color, turn);

                    if player_color != turn {
                        #[cfg(debug_assertions)]
                        println!("❌ 차례가 아닙니다!");
                        return response;
                    }

                    // 착수 시도
                    let success = match self.game.chaksu(chaksu_request.coordinate as u16, true) {
                        Ok(_) => {
                            game_room_status = GameRoomResponse::ChangeTurn;
                            self.players
                                .switch_turn(self.game.board.is_turn().reverse());

                            #[cfg(debug_assertions)]
                            println!("✅ 착수 성공! 턴 변경됨");
                            true
                        }
                        Err(_e) => {
                            #[cfg(debug_assertions)]
                            match _e {
                                crate::geme_old::badukboard::BadukBoardError::BannedChaksu => {
                                    println!("⛔ 착수 실패: 금수!");
                                }
                                crate::geme_old::badukboard::BadukBoardError::OverLap => {
                                    println!("❌ 착수 실패: 이미 돌이 있음");
                                }
                                _ => {
                                    println!("❌ 착수 실패: {:?}", _e);
                                }
                            }
                            false
                        }
                    };

                    let the_winner = match self.game.winner() {
                        Some(color) => {
                            game_room_status = GameRoomResponse::GameOver;
                            self.record_winner(color);
                            Some(convert_game2proto_color(color) as i32)
                        }
                        None => None,
                    };

                    response = (
                        game_room_status,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                            the_winner: the_winner,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(server_to_client_response::Payload::Coordinate(
                                ChaksuResponse { success: success },
                            )),
                        },
                    );
                }

                // 기권 처리
                Some(Payload::Resign(_resign_request)) => {
                    use doljabiproto::badukboard::ResignResponse;

                    let winner = self.players.check_id_to_color(user_id).reverse();
                    self.game.set_winner(winner);
                    self.record_winner(winner);

                    response = (
                        GameRoomResponse::GameOver,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                            the_winner: Some(convert_game2proto_color(winner) as i32),
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(server_to_client_response::Payload::Resign(
                                ResignResponse {},
                            )),
                        },
                    );
                }

                // 무승부 신청
                Some(Payload::DrawOffer(_draw_request)) => {
                    use doljabiproto::badukboard::DrawOfferResponse;
                    let mut winner = None;
                    let offer_player = self.players.check_id_to_color(user_id);
                    let mut game_room_status = GameRoomResponse::None;

                    match &offer_player {
                        Color::Black => {
                            self.players.black_player.as_mut().map(|p| p.draw_offer());
                        }
                        Color::White => {
                            self.players.white_player.as_mut().map(|p| p.draw_offer());
                        }
                        _ => {}
                    }

                    // 둘 다 무승부 요청을 하면 비김
                    if self.players.check_draw() {
                        game_room_status = GameRoomResponse::GameOver;
                        self.game.set_winner(Color::Free);
                        self.record_winner(Color::Free);
                        winner = Some(convert_game2proto_color(Color::Free) as i32);
                    }

                    let user_name = self
                        .user_info(offer_player)
                        .as_ref()
                        .map_or("".to_string(), |player| player.user_name.clone());
                    let draw_offer_response = DrawOfferResponse {
                        user_name: user_name,
                    };

                    response = (
                        game_room_status,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                            the_winner: winner,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(server_to_client_response::Payload::DrawOffer(
                                draw_offer_response,
                            )),
                        },
                    );
                }

                // 턴 넘김
                Some(Payload::PassTurn(_pass_request)) => {
                    use doljabiproto::badukboard::PassTurnResponse;
                    let turn = self.game.is_board().is_turn();

                    // 턴 넘김을 시도하는 사람의 턴인지 확인
                    if self.players.check_id_to_color(user_id) != turn {
                        return response;
                    }

                    // turn 변경
                    self.players.switch_turn(turn);
                    self.game.board.switch_turn();

                    response = (
                        GameRoomResponse::ChangeTurn,
                        ServerToClient {
                            response_type: true,
                            turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                            the_winner: None,
                            game_state: Some(self.badukboard_status()),
                            users_info: None,
                            payload: Some(server_to_client_response::Payload::PassTurn(
                                PassTurnResponse {},
                            )),
                        },
                    );
                }

                // 알 수 없는 요청 처리
                _ => {}
            }
        }

        response
    }
}
