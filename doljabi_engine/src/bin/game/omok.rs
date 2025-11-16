use derive_builder::Builder;
use std::collections::{HashMap, HashSet};
use crate::game::badukboard::{*};

#[derive(Clone, Debug, Builder)]
pub struct Omok {
    board: BadukBoard,
    players: Players,

    black_linked_stone_set: HashMap<u16, HashSet<u16>>,
    white_linked_stone_set: HashMap<u16, HashSet<u16>>,

} impl Omok {
    pub fn new() -> Self {
        Self {
            board: BadukBoard::new(),
            players: Players::new(),

            black_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
            white_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
        }
    }
    // TODO: 흑백 스위칭
}

/// 착수 시도 실패 시 Err 출력
pub fn chaksu(game: &mut Omok, coordinate: u16) -> Result<(),BadukBoardError> {
    let color = game.board.is_turn();
    if !game.board.is_free(coordinate) {return Err(BadukBoardError::OverLap);}
    // TODO: 33 규칙 확인하기
    // TODO: 다른 착수 금지 규칙 확인하기
    // TODO: 돌 5개 연결 되었는지 확인
    game.board.push_stone(coordinate, color);
    Ok(())
}

// TODO: 돌 5개 연결 확인 및 게임 종료
