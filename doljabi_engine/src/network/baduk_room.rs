use crate::{game::{baduk::Baduk, badukboard::{BadukBoardGameConfig, Players}}, network::room_manager::{GameRoomResponse, GameLogic, convert_game2proto_color}, proto::badukboardproto::{ClientToServerRequest, ServerToClientResponse}};

pub struct BadukRoom {
    game: Baduk,
    game_config: BadukBoardGameConfig,
    players: Players,
} impl BadukRoom {
    pub fn new(game_config: BadukBoardGameConfig) -> Self { Self {
        game: Baduk::new(),
        game_config: game_config,
        players: Players::new(),
    }}

    pub fn game(&self) -> &Baduk {
        &self.game
    }

    pub fn players_mut(&mut self) -> &mut Players {
        &mut self.players
    }

    pub fn players(&self) -> &Players {
        &self.players
    }

    pub fn turn_user_id(&self) -> Option<u64> {
        let color = self.game.board.is_turn();
        self.players.user_id(color)
    }

    pub fn baduk_board_state(&self) -> crate::proto::badukboardproto::BadukBoardState {
        use crate::proto::badukboardproto::BadukBoardState;
        
        BadukBoardState {
            black: self.game.board.bitboard_black().to_vec(),
            white: self.game.board.bitboard_white().to_vec(),
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
}

impl GameLogic for BadukRoom {
    fn check_empty_room(&self) -> bool {
        self.players().check_empty_room()
    }

    fn push_user(&mut self, user_id: u64) -> bool {
        self.players_mut().push_user(user_id)
    }

    fn pop_user(&mut self, user_id: u64) -> bool {
        self.players_mut().pop_user(user_id)
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
                        game_state: None,               //(self.omok_status()),
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
                        game_state: None,               //(self.omok_status()),
                        users_info: None,
                        payload: None,
                    })
                } else {
                    self.game.set_winner(self.game.board.is_turn().reverse());
                    (GameRoomResponse::GameOver, ServerToClientResponse{
                        response_type: true,
                        turn: convert_game2proto_color(self.game.board.is_turn()) as i32,
                        the_winner: self.game.winner().map(|w| convert_game2proto_color(w.clone()) as i32),
                        game_state: None,               //(self.omok_status()),
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
        let _data = match input_data {
            _ => input_data
        };
        
        let response = (GameRoomResponse::None, ServerToClientResponse{
            response_type: false,
            the_winner: None,
            turn: convert_game2proto_color(crate::game::badukboard::Color::Free) as i32,
            game_state: None,
            users_info: None,
            payload: None,
        });

        response
    }

}

// TODO: 착수 요청 처리
// TODO: 무승부 요청 처리
// TODO: 기권 처리
// TODO: 수넘김 처리