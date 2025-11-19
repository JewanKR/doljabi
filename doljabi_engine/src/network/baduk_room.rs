use tokio::sync::mpsc;
use crate::game::{baduk::Baduk, badukboard::{BadukBoardGameConfig, Color, Players}};

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
    /*
    pub fn check_winner(&self) -> Option<Color> {
        self.game.winner()
    }
    */
    pub fn check_emtpy_room(&self) -> bool {
        self.players.check_emtpy_room()
    }

    pub async fn send_poweroff(&mut self) {
        let _ = self.poweroff.send(()).await;
    }
}
// TODO: 착수 요청 처리
// TODO: 무승부 요청 처리
// TODO: 기권 처리
// TODO: 수넘김 처리