use tokio::sync::mpsc;
use crate::{game::{badukboard::{BadukBoardGameConfig, Color, Players}, omok::Omok}, network::{room_manager::{GameLogic, convert_game2proto_color}, socket::RoomCommunicationDataForm}, proto::badukboardproto::{ClientToServerRequest, GameStartResponse, GameState, ServerToClientResponse, server_to_client_response}};

pub struct OmokRoom {
    game: Omok,
    game_config: BadukBoardGameConfig,
    players: Players,
    poweroff: mpsc::Sender<()>
} impl OmokRoom {
    pub fn new(game_config: BadukBoardGameConfig, poweroff: mpsc::Sender<()>) -> Self { Self {
        game: Omok::new(),
        game_config: game_config,
        players: Players::new(),
        poweroff: poweroff,
    }}

    pub fn game(&self) -> &Omok {
        &self.game
    }

    pub fn players_mut(&mut self) -> &mut Players {
        &mut self.players
    }

    pub fn players(&self) -> &Players {
        &self.players
    }

    pub fn send_poweroff(&mut self) {
        let _ = self.poweroff.try_send(());
    }

    pub fn turn_user_id(&self) -> Option<u64> {
        let color = self.game.is_board().is_turn();
        self.players.user_id(color)
    }

    pub fn set_players_time(&mut self, config: &BadukBoardGameConfig) -> bool {
        if !self.players().full_players() {
            return false;
        }
        self.players_mut().set_players(&config);

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

    pub fn omok_status(&self) -> ServerToClientResponse {
        use crate::proto::badukboardproto::{PassTurnResponse, GameState};
        let pass_response = PassTurnResponse {
            game_state: Some(GameState {
                board: Some(self.baduk_board_state()),
                black_time: Some(self.black_player_time_info()),
                white_time: Some(self.white_player_time_info()),
                turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
            }),
        };

        ServerToClientResponse {
            response_type: true,
            the_winner: None,
            payload: Some(server_to_client_response::Payload::PassTurn(pass_response)),
        }
    }

    fn users_info_response(&self) -> ServerToClientResponse {
        use crate::proto::badukboardproto::{UsersInfo, {server_to_client_response::Payload}};

        ServerToClientResponse { 
            response_type: true,
            the_winner: None,
            payload: Some(Payload::UsersInfo(UsersInfo{
                black: None, 
                white: None,
            })),
        }
    }
}

impl GameLogic for OmokRoom { 
    fn check_emtpy_room(&self) -> bool {
        self.players().check_emtpy_room()
    }

    fn input_data(&mut self, input_data: RoomCommunicationDataForm) -> Option<ServerToClientResponse> {
        
        let data = match input_data.client_to_server_request {
            Some(requset) => {
                use crate::proto::badukboardproto::client_to_server_request::Payload;
                if let Some(Payload::Gamestart(_)) = &requset.payload {
                    if self.players().full_players() {
                        use crate::proto::badukboardproto::GameState;
                        return Some(ServerToClientResponse{
                            response_type: true,
                            the_winner: None,
                            payload: Some(server_to_client_response::Payload::GameStart( GameStartResponse{
                                game_start: Some(GameState{
                                    board: Some(self.baduk_board_state()),
                                    black_time: Some(self.black_player_time_info()),
                                    white_time: Some(self.white_player_time_info()),
                                    turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                                }),
                                users_info: None,
                            }))
                        });
                    }
                }

                if Some(input_data.user_id) == self.turn_user_id() {
                    requset
                } else {
                    return None;
                }
            },
            None => {
                if self.players.push_user(input_data.user_id.clone()) {
                    return Some(self.users_info_response());
                } else {
                    return None;
                }
            }
        };

        use crate::proto::badukboardproto::client_to_server_request::Payload;
        match data.payload {
            Some(Payload::Coordinate(chaksu_request)) => {
                use crate::proto::badukboardproto::{ChaksuResponse, GameState};
                let turn =  self.game.is_board().is_turn();

                // 착수 시도
                let success = match self.game.chaksu(chaksu_request.coordinate as u16, true) {
                    Ok(_) => {
                        self.players.switch_turn(turn);
                        true
                    }
                    Err(_) => {false}
                };

                // 응답 데이터
                let chaksu_response = ChaksuResponse {
                    success: success,
                    game_state: Some(GameState {
                        board: Some(self.baduk_board_state()),
                        black_time: Some(self.black_player_time_info()),
                        white_time: Some(self.white_player_time_info()),
                        turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    }),
                };

                let the_winner = match self.game().winner() {
                    Some(color) => {
                        let _ = self.poweroff.try_send(());
                        Some(convert_game2proto_color(color) as i32)
                    }
                    None => None
                };

                let payload_enum = server_to_client_response::Payload::Coordinate(chaksu_response);
                Some(ServerToClientResponse {
                    response_type: true,
                    the_winner: the_winner,
                    payload: Some(payload_enum),
                })
            },
            Some(Payload::Resign(_resign_request)) => {
                use crate::proto::badukboardproto::ResignResponse;

                let user_color = self.game.is_board().is_turn();

                let winner = match user_color {
                    Color::Black => {Color::White}
                    Color::White => {Color::Black}
                    Color::Free => {Color::Free}
                    _ => {Color::ColorError}
                };

                let resign_response = ResignResponse {};
                
                Some(ServerToClientResponse {
                    response_type: true,
                    the_winner: Some(convert_game2proto_color(winner) as i32),
                    payload: Some(server_to_client_response::Payload::Resign(resign_response)),
                })
            },
            Some(Payload::DrawOffer(_draw_request)) => {
                use crate::proto::badukboardproto::DrawOfferResponse;

                // TODO: 무승부 요청 로직 수행
                let accepted = false; // 예시값

                let _draw_response = DrawOfferResponse {
                    accepted: accepted,
                };

                Some(ServerToClientResponse {
                    response_type: false,
                    the_winner: None,
                    payload: None,
                    //payload: Some(server_to_client_response::Payload::DrawOffer(draw_response)),
                })
            },
            Some(Payload::PassTurn(_pass_request)) => {
                use crate::proto::badukboardproto::{PassTurnResponse, GameState};
                let turn = self.game.is_board().is_turn();

                // turn 변경
                self.players.switch_turn(turn);
                self.game.switch_turn();

                // 응답 데이터
                let pass_response = PassTurnResponse {
                    game_state: Some(GameState {
                        board: Some(self.baduk_board_state()),
                        black_time: Some(self.black_player_time_info()),
                        white_time: Some(self.white_player_time_info()),
                        turn: convert_game2proto_color(self.game.is_board().is_turn()) as i32,
                    }),
                };

                Some(ServerToClientResponse {
                    response_type: true,
                    the_winner: None,
                    payload: Some(server_to_client_response::Payload::PassTurn(pass_response)),
                })
            },
            _ => {
                // 알 수 없는 요청 처리
                Some(ServerToClientResponse {
                    response_type: false,
                    the_winner: None,
                    payload: None,
                })
            }
        }
    }
}
