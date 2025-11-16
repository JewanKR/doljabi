use crate::game::{baduk::Baduk, badukboard::{BadukBoardGameConfig, Players}};

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

    // User 접속 구현
    pub fn push_user(&mut self, user_id: u64) -> bool {
        self.players.push_user(user_id)
    }

    pub fn pop_user(&mut self, user_id: u64) -> bool {
        self.players.pop_user(user_id)
    }
}

// TODO: 착수 요청 처리
// TODO: 무승부 요청 처리
// TODO: 기권 처리
// TODO: 수넘김 처리