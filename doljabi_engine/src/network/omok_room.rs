use tokio::sync::mpsc;
use crate::{game::{badukboard::{BadukBoardGameConfig, Color, Players}, omok::Omok}, network::room_manager::convert_game2proto_color, proto::badukboardproto::{ClientToServerRequest, ServerToClientResponse, server_to_client_response}};

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

    // User 접속 구현
    pub fn push_user(&mut self, user_id: u64) -> bool {
        self.players.push_user(user_id)
    }

    pub fn pop_user(&mut self, user_id: u64) -> bool {
        self.players.pop_user(user_id)
    }

    pub fn run(&mut self) -> bool {
        self.players.set_players(&self.game_config)
    }

    pub fn check_winner(&self) -> Option<Color> {
        self.game.winner()
    }

    pub fn check_emtpy_room(&self) -> bool {
        self.players.check_emtpy_room()
    }

    pub async fn send_poweroff(&mut self) {
        let _ = self.poweroff.send(()).await;
    }

    pub fn input_data(&mut self, data: ClientToServerRequest) -> ServerToClientResponse {
        use crate::proto::badukboardproto::client_to_server_request::Payload;

        match data.payload {
            Some(Payload::Coordinate(chaksu_request)) => {
                use crate::proto::badukboardproto::{ChaksuResponse, GameState, BadukBoardState, PlayerTimeInfo};

                // 착수 시도
                let success = match self.game.chaksu(chaksu_request.coordinate as u16, true) {
                    Ok(_) => {true}
                    Err(_) => {false}
                };
                
                if let Some(winner) = self.check_winner() {
                    let _ = self.poweroff.send(());
                }

                // 게임 정보
                let game_state = self.game.is_board();
                let black_player_state = self.players.black_player_state().output();
                let white_player_state = self.players.white_player_state().output();

                // 응답 데이터
                let chaksu_response = ChaksuResponse {
                    success: success,
                    game_state: Some(GameState {
                        board: Some(BadukBoardState {
                            black: game_state.bitboard_black().to_vec(),
                            white: game_state.bitboard_white().to_vec(),
                        }),
                        black_time: Some(PlayerTimeInfo {
                            main_time: black_player_state.0,
                            fischer_time: black_player_state.1,
                            remaining_overtime: black_player_state.2 as u32,
                            overtime: black_player_state.3,
                        }),
                        white_time: Some(PlayerTimeInfo {
                            main_time: white_player_state.0,
                            fischer_time: white_player_state.1,
                            remaining_overtime: white_player_state.2 as u32,
                            overtime: white_player_state.3,
                        }),
                        turn: convert_game2proto_color(game_state.is_turn()) as i32,
                    }),
                };
                let payload_enum = server_to_client_response::Payload::Coordinate(chaksu_response);
                ServerToClientResponse {
                    response_type: true,
                    payload: Some(payload_enum),
                }
            },
            Some(Payload::Resign(_resign_request)) => {
                use crate::proto::badukboardproto::ResignResponse;

                // TODO: 기권 로직 수행
                let _resign_response = ResignResponse {};

                ServerToClientResponse {
                    response_type: false,
                    payload: None,
                    //payload: Some(server_to_client_response::Payload::Resign(resign_response)),
                }
            },
            Some(Payload::DrawOffer(_draw_request)) => {
                use crate::proto::badukboardproto::DrawOfferResponse;

                // TODO: 무승부 요청 로직 수행
                let accepted = false; // 예시값

                let _draw_response = DrawOfferResponse {
                    accepted: accepted,
                };

                ServerToClientResponse {
                    response_type: false,
                    payload: None,
                    //payload: Some(server_to_client_response::Payload::DrawOffer(draw_response)),
                }
            },
            Some(Payload::PassTurn(_pass_request)) => {
                use crate::proto::badukboardproto::{PassTurnResponse, GameState, BadukBoardState, PlayerTimeInfo};

                // turn 변경
                self.game.switch_turn();

                // 게임 정보
                let game_state = self.game.is_board();
                let black_player_state = self.players.black_player_state().output();
                let white_player_state = self.players.white_player_state().output();

                // 응답 데이터
                let pass_response = PassTurnResponse {
                    game_state: Some(GameState {
                        board: Some(BadukBoardState {
                            black: game_state.bitboard_black().to_vec(),
                            white: game_state.bitboard_white().to_vec(),
                        }),
                        black_time: Some(PlayerTimeInfo {
                            main_time: black_player_state.0,
                            fischer_time: black_player_state.1,
                            remaining_overtime: black_player_state.2 as u32,
                            overtime: black_player_state.3,
                        }),
                        white_time: Some(PlayerTimeInfo {
                            main_time: white_player_state.0,
                            fischer_time: white_player_state.1,
                            remaining_overtime: white_player_state.2 as u32,
                            overtime: white_player_state.3,
                        }),
                        turn: convert_game2proto_color(game_state.is_turn()) as i32,
                    }),
                };

                ServerToClientResponse {
                    response_type: true,
                    payload: Some(server_to_client_response::Payload::PassTurn(pass_response)),
                }
            },
            _ => {
                // 알 수 없는 요청 처리
                ServerToClientResponse {
                    response_type: false,
                    payload: None,
                }
            }
        }
    }
}
