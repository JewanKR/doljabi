use crate::game::{baduk, omok, badukboard};
use axum::{routing::{get, post, patch, delete}, http::StatusCode, Json, Router};
use utoipa_axum::{router::OpenApiRouter, routes};

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Location {
    Lobby,
    Room,
    Game,
}

pub enum Gamemode {
    Baduk,
    Omok,
}

pub enum Game {
    Baduk(baduk::Baduk),
    Omok(omok::Omok),
}

// main() 에서 users = HashMap<id, User>
/// Arc::new(Mutex::new(User::default()))를 이용해 생성
struct Room {
    room_id: u64,
    game: Game,
    enter_code: u16,
} impl Room {
    pub fn new(roomid: usize, game_mode: Gamemode) -> Self {
        Self {
            room_id: roomid as u64,
            game: set_game(game_mode),
            enter_code: 10000 as u16,
        }
    }
}

fn set_game(game_mode: Gamemode) -> Game {
    match game_mode {
        Gamemode::Baduk => Game::Baduk(baduk::Baduk::new()),
        Gamemode::Omok => Game::Omok(omok::Omok::new())
    }
}
/* 
// 방 관련 라우터 설정
pub fn room_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(room_list, create_room))
}

async fn room_list() {

}

async fn create_room() {

}
*/