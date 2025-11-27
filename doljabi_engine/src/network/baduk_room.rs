use tokio::sync::mpsc;
use crate::{game::{baduk::Baduk, badukboard::{BadukBoardGameConfig, Players}}, network::{room_manager::GameLogic, socket::RoomCommunicationDataForm}, proto::badukboardproto::ServerToClientResponse};

pub struct BadukRoom {
    game: Baduk,
    game_config: BadukBoardGameConfig,
    players: Players,
    poweroff: mpsc::Sender<()>,
} impl BadukRoom {
    pub fn new(game_config: BadukBoardGameConfig, poweroff: mpsc::Sender<()>) -> Self { Self {
        game: Baduk::new(),
        game_config: game_config,
        players: Players::new(),
        poweroff: poweroff,
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

    pub fn send_poweroff(&mut self) {
        let _ = self.poweroff.try_send(());
    }

    pub fn turn_user_id(&self) -> Option<u64> {
        let color = self.game.is_board().is_turn();
        self.players.user_id(color)
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
}

impl GameLogic for BadukRoom {
    fn check_emtpy_room(&self) -> bool {
        self.players().check_emtpy_room()
    }

    fn input_data(&mut self, input_data: RoomCommunicationDataForm) -> Option<ServerToClientResponse> {
        let _data = match input_data {
            _ => input_data
        };
        
        // 알 수 없는 요청 처리
        /*
        ServerToClientResponse {
            response_type: false,
            the_winner: None,
            payload: None,
        }
        */
        None
    }

}

// TODO: 착수 요청 처리
// TODO: 무승부 요청 처리
// TODO: 기권 처리
// TODO: 수넘김 처리