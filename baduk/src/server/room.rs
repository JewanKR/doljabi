use crate::game::{baduk, omok};

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Location {
    Lobby,
    Room,
    Game,
}

pub enum Gamemode {
    Baduk(baduk::Baduk),
    Omok(omok::Omok),
}

// main() 에서 users = HashMap<id, User>
/// Arc::new(Mutex::new(User::default()))를 이용해 생성
struct Room {
    room_id: u64,
    game_mode: Gamemode,
    game_start: bool,
    enter_code: u16,
} impl Room {
    pub fn new(roomid: usize, game_mode: Gamemode) -> Self {
        Self {
            room_id: roomid as u64,
            game_mode: game_mode,
            game_start: false,
            enter_code: 10000 as u16,
        }
    }

    // TODO: 게임 시작 구현
    // TODO: User 접속 구현
    // TODO: User 방 나가기 구현

}
