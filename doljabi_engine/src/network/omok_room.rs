use crate::{game::{badukboard::{BadukBoardGameConfig, Color, Players}, omok::Omok}, network::room_manager::{GameRoomResponse, GameLogic, convert_game2proto_color}, proto::badukboardproto::{ClientToServerRequest, GameStartResponse, ServerToClientResponse, server_to_client_response}};

pub struct OmokRoom {
    running: bool,
    game: Omok,
    game_config: BadukBoardGameConfig,
    players: Players,
} impl OmokRoom {
    pub fn new(game_config: BadukBoardGameConfig) -> Self { Self {
        running: false,
        game: Omok::new(),
        game_config: game_config,
        players: Players::new(),
    }}

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

    pub fn baduk_board_state(&self) -> crate::proto::badukboardproto::BadukBoardState {
        use crate::proto::badukboardproto::BadukBoardState;
        
        let game_state = self.game.is_board();
        BadukBoardState {
            black: game_state.bitboard_black().to_vec(),
            white: game_state.bitboard_white().to_vec()
        }
    }

    pub fn black_player_time_info(&self) -> crate::proto::badukboardproto::PlayerTimeInfo {
        use crate::proto::badukboardproto::PlayerTimeInfo;

        let player_state = match self.players.black_player_state() {
            Some(player) => player.output(),
            None => BadukBoardGameConfig::empty().output(),
        };

        PlayerTimeInfo {
            main_time: player_state.0,
            fischer_time: player_state.1,
            remaining_overtime: player_state.2 as u32,
            overtime: player_state.3
        }
    }

    pub fn white_player_time_info(&self) -> crate::proto::badukboardproto::PlayerTimeInfo {
        use crate::proto::badukboardproto::PlayerTimeInfo;

        let player_state = match self.players.white_player_state() {
            Some(player) => player.output(),
            None => BadukBoardGameConfig::empty().output(),
        };

        PlayerTimeInfo {
            main_time: player_state.0,
            fischer_time: player_state.1,
            remaining_overtime: player_state.2 as u32,
            overtime: player_state.3
        }
    }

    pub fn omok_status(&self) -> crate::proto::badukboardproto::GameState {
        crate::proto::badukboardproto::GameState {
            board: Some(self.baduk_board_state()),
            black_time: Some(self.black_player_time_info()),
            white_time: Some(self.white_player_time_info()),
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

    fn users_info(&self) -> crate::proto::badukboardproto::UsersInfo {
        use crate::proto::badukboardproto::{UsersInfo, UserInfo};
        UsersInfo {
            black: self.players.black_player.as_ref().map(|_| UserInfo {
                user_name: "black player".to_string(),
                rating: 0
            }),
            white: self.players.white_player.as_ref().map(|_| UserInfo {
                user_name: "white player".to_string(),
                rating: 0
            })
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
                    Duration::from_secs(u64::MAX)
                }
            }
            None => Duration::from_secs(u64::MAX)
        }
    }

    fn timer_interrupt(&mut self) -> (GameRoomResponse, ServerToClientResponse) {
        let turn_player = self.players.turn_player_mut(self.game.board.is_turn());

        match turn_player {
            Some(p) => {
                if p.main_time() > 0 {
                    p.sub_main_time();
                    self.set_timer();
                    (GameRoomResponse::None, ServerToClientResponse{
                        response_type: true,
                        turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                        the_winner: None,
                        game_state: Some(self.omok_status()),
                        users_info: None,
                        payload: None,
                    })
                } else if p.remain_time() > 0 {
                    p.sub_remain_overtime();
                    self.set_timer();
                    (GameRoomResponse::None, ServerToClientResponse{
                        response_type: true,
                        turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                        the_winner: None,
                        game_state: Some(self.omok_status()),
                        users_info: None,
                        payload: None,
                    })
                } else {
                    self.game.set_winner(self.game.board.is_turn().reverse());
                    (GameRoomResponse::GameOver, ServerToClientResponse{
                        response_type: true,
                        turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                        the_winner: self.game.winner().map(|w| convert_game2proto_color(w.clone()) as i32),
                        game_state: Some(self.omok_status()),
                        users_info: None,
                        payload: None,
                    })
                }
            }
            None => {
                (GameRoomResponse::None, ServerToClientResponse{
                    response_type: false,
                    turn: crate::proto::badukboardproto::Color::Free as i32,
                    game_state: None,
                    users_info: None,
                    the_winner: None,
                    payload: None,
                })
            }
        }
    }

    fn input_data(&mut self, input_data: (u64, ClientToServerRequest)) -> (GameRoomResponse, ServerToClientResponse) {
        use crate::proto::badukboardproto::client_to_server_request::Payload;

        let (user_id, requset) = input_data;

        let mut response = (GameRoomResponse::None, ServerToClientResponse{
            response_type: false,
            turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
            the_winner: None,
            game_state: None,
            users_info: None,
            payload: None,
    });

        // 게임 시작 요청 처리
        if let Some(Payload::Gamestart(_)) = &requset.payload {
            // 플레이어가 모두 접속 중인지 확인
            if self.players.full_players() {
                self.running = true;
                self.set_players_time(&self.game_config.clone());

                use crate::proto::badukboardproto::{UsersInfo, UserInfo};
                response = (GameRoomResponse::GameStart, ServerToClientResponse{
                    response_type: true,
                    turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    the_winner: None,
                    game_state: Some(self.omok_status()),
                    users_info: Some(UsersInfo{
                        black: Some(UserInfo{user_name: "black player".to_string(), rating: 0}),
                        white: Some(UserInfo{user_name: "white player".to_string(), rating: 0})
                    }),
                    payload: Some(server_to_client_response::Payload::GameStart(GameStartResponse{}))
                })
            }
        }

        if self.running { match requset.payload {
            Some(Payload::Coordinate(chaksu_request)) => {
                use crate::proto::badukboardproto::ChaksuResponse;
                let turn =  self.game.is_board().is_turn();
                let mut game_room_status = GameRoomResponse::None;

                // 착수를 시도하는 사람의 턴인지 확인
                if self.players.check_id_to_color(user_id) != turn {
                    return response;
                }

                // 착수 시도
                let success = match self.game.chaksu(chaksu_request.coordinate as u16, true) {
                    Ok(_) => {
                        game_room_status = GameRoomResponse::ChangeTrun;
                        true
                    }
                    Err(_) => {false}
                };

                let the_winner = match self.game.winner() {
                    Some(color) => {
                        game_room_status = GameRoomResponse::GameOver;
                        Some(convert_game2proto_color(color) as i32)
                    },
                    None => None
                };

                response = (game_room_status ,ServerToClientResponse {
                    response_type: true,
                    turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    the_winner: the_winner,
                    game_state: Some(self.omok_status()),
                    users_info: None,
                    payload: Some(server_to_client_response::Payload::Coordinate(ChaksuResponse { success: success })),
                });
            },

            // 기권 처리
            Some(Payload::Resign(_resign_request)) => {
                use crate::proto::badukboardproto::ResignResponse;

                let user_color = self.game.is_board().is_turn();

                let winner = match user_color {
                    Color::Black => {Color::White}
                    Color::White => {Color::Black}
                    Color::Free => {Color::Free}
                    _ => {Color::ColorError}
                };

                self.game.set_winner(winner);
                
                response = (GameRoomResponse::GameOver, ServerToClientResponse {
                    response_type: true,
                    turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    the_winner: Some(convert_game2proto_color(winner) as i32),
                    game_state: Some(self.omok_status()),
                    users_info: None,
                    payload: Some(server_to_client_response::Payload::Resign(ResignResponse{})),
                });
            },

            // 무승부 신청
            Some(Payload::DrawOffer(_draw_request)) => {
                use crate::proto::badukboardproto::DrawOfferResponse;
                let mut winner = None;
                let offer_player = self.players.check_id_to_color(user_id);
                let mut game_room_status = GameRoomResponse::None;

                // 둘 다 무승부 요청을 하면 비김
                if self.players.check_draw() {
                    game_room_status = GameRoomResponse::GameOver;
                    self.game.set_winner(Color::Free);
                    winner = Some(convert_game2proto_color(Color::Free) as i32);
                }

                let draw_offer_response = DrawOfferResponse { user_name: format!("{} player", offer_player.to_string()) };

                response = (game_room_status, ServerToClientResponse {
                    response_type: true,
                    turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    the_winner: winner,
                    game_state: Some(self.omok_status()),
                    users_info: None,
                    payload: Some(server_to_client_response::Payload::DrawOffer(draw_offer_response)),
                });
            },

            // 턴 넘김
            Some(Payload::PassTurn(_pass_request)) => {
                use crate::proto::badukboardproto::PassTurnResponse;
                let turn = self.game.is_board().is_turn();

                // 턴 넘김을 시도하는 사람의 턴인지 확인
                if self.players.check_id_to_color(user_id) != turn {
                    return response;
                }

                // turn 변경
                self.game.switch_turn();

                response = (GameRoomResponse::ChangeTrun, ServerToClientResponse {
                    response_type: true,
                    turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    the_winner: None,
                    game_state: Some(self.omok_status()),
                    users_info: None,
                    payload: Some(server_to_client_response::Payload::PassTurn(PassTurnResponse{})),
                });
            },

            // 알 수 없는 요청 처리
            _ => {}
        }}

        response
    }
}
