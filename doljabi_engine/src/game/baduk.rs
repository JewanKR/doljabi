use derive_builder::Builder;
use std::collections::{HashMap, HashSet, VecDeque};
use crate::game::badukboard::*;

#[derive(Clone, Debug, Builder)]
pub struct Baduk {
    board: BadukBoard,
    players: Players,

    black_caught_stone: u16,
    white_caught_stone: u16,
}

impl Baduk {
    pub fn new() -> Self {
        Self {
            board: BadukBoard::new(),
            players: Players::new(),

            black_caught_stone: 0,
            white_caught_stone: 0,
        }
    }

    fn adjacent_coordinates(&self, coordinate: u16) -> Vec<u16> {
        let board_size = self.board.boardsize();
        let mut result = Vec::new();
        let x = coordinate % board_size;
        let y = coordinate / board_size;

        if x > 0 {
            result.push(coordinate - 1);
        }
        if x + 1 < board_size {
            result.push(coordinate + 1);
        }
        if y > 0 {
            result.push(coordinate - board_size);
        }
        if y + 1 < board_size {
            result.push(coordinate + board_size);
        }

        result
    }

    fn collect_group_state(
        &self,
        start: u16,
        color: Color,
    ) -> Option<HashSet<u16>> {
        let mut to_explore = VecDeque::from([start]);
        let mut explored = HashSet::new();
        explored.insert(start);

        while let Some(current) = to_explore.pop_front() {
            for neighbor in self.adjacent_coordinates(current) {
                if self.board.is_free(neighbor) {
                    return None;
                }

                if self.board.check_color(neighbor, color) && !explored.contains(&neighbor) {
                    explored.insert(neighbor);
                    to_explore.push_back(neighbor);
                }
            }
        }

        Some(explored)
    }

    fn remove_group(&mut self, stones: &HashSet<u16>, color: Color) {
        for &stone in stones {
            self.board.delete_stone(stone, color);
        }

        let captured_count = stones.len() as u16;
        match color {
            Color::Black => {
                self.white_caught_stone = self.white_caught_stone.saturating_add(captured_count);
                println!("{}",self.white_caught_stone);
            }
            Color::White => {
                self.black_caught_stone = self.black_caught_stone.saturating_add(captured_count);
                println!("{}",self.black_caught_stone);
            }
            _ => {}
        }
    }

    pub fn resolve_after_move(
        &mut self,
        coordinate: u16,
        color: Color,
    ) -> Result<(), BadukBoardError> {
        let opponent_color = match color {
            Color::Black => Color::White,
            Color::White => Color::Black,
            _ => return Err(BadukBoardError::InvalidArgument),
        };

        for neighbor in self.adjacent_coordinates(coordinate) {
            if self.board.check_color(neighbor, opponent_color) {
                if let Some(opponent_group) = self.collect_group_state(neighbor, opponent_color) {
                    self.remove_group(&opponent_group, opponent_color);
                }
            }
        }

        if let Some(own_group) = self.collect_group_state(coordinate, color) {
            for stone in own_group {
                self.board.delete_stone(stone, color);
            }
            return Err(BadukBoardError::BannedChaksu);
        };

        Ok(())
    }
}

enum BadukCommandList {
    Chaksu = 1,
    DrawRequest = 2,
    Pass = 3,
}

// TODO: 반복수 검사 구현

/// 착수 시도 실패 시 Err 출력
pub fn chaksu(board: &mut Baduk, coordinate: u16) -> Result<(),BadukBoardError> {
    board.board.check_outboard_coordinate(coordinate)?;

    let color = board.board.is_turn();
    let color_str = match color {Color::Black => "black", Color::White => "white", _ => " "};

    if !board.board.is_free(coordinate) {
        println!("{}, {} 착수 실패: OverLap", color_str, coordinate);
        return Err(BadukBoardError::OverLap);
    }

    // 1: 상대돌 잡았는지 확인
    // 2: 자살수 판별
    board.board.push_stone(coordinate, color);
    if let Err(err) = board.resolve_after_move(coordinate, color) {
        println!("{}, {} 착수 실패", color_str, coordinate);
        return Err(err);
    }

    // TODO: 반복수(패) 금지 확인

    board.board.switch_turn();
    Ok(())
}

// TODO: 공배 규칙 적용하기
// TODO: 집 판별(살아있는 집)
// TODO: 집 수 계산 및 계가
// TODO: 승패 표시

// TODO: 수 넘김 처리
