use derive_builder::Builder;
use std::collections::{HashMap, HashSet};
use crate::game::badukboard::{*};

const BOARDSIZE: usize = 19;

#[derive(Clone, Debug, Builder)]
pub struct Baduk {
    board: BadukBoard,
    players: Players,

    black_linked_stone_set: HashMap<u16, HashSet<u16>>,
    white_linked_stone_set: HashMap<u16, HashSet<u16>>,
    black_caught_stone: u16,
    white_caught_stone: u16,

} impl Baduk {
    pub fn new() -> Self {
        Self {
            board: BadukBoard::new(),
            players: Players::new(),
            
            black_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
            white_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
            black_caught_stone: 0,
            white_caught_stone: 0,
        }
    }
    // TODO: 흑백 스위칭
}

enum BadukCommandList {
    Chaksu = 1,
    DrawRequest = 2,
    Pass = 3,
}

// TODO: 연결 된 돌 확인 및 linked_stone_set: HashMap<HashSet>에 저장
// TODO: 먹히는 돌 판별
// TODO: 자살수 검사 구현
// TODO: 반복수 검사 구현

/// 착수 시도 실패 시 Err 출력
pub fn chaksu(board: &mut Baduk, coordinate: u16) -> Result<(),BadukBoardError> {
    let color = board.board.is_turn();
    if !board.board.is_free(coordinate) {return Err(BadukBoardError::OverLap);}
    // TODO: 상대 돌 먹는지 확인
    // TODO: 자살수 확인
    // TODO: 반복수(패) 금지 확인
    board.board.push_stone(coordinate, color);
    Ok(())
}

// TODO: 공배 규칙 적용하기
// TODO: 집 판별(살아있는 집)
// TODO: 집 수 계산 및 계가
// TODO: 승패 표시

// TODO: 수 넘김 처리
