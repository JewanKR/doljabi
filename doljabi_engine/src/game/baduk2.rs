use derive_builder::Builder;
use std::collections::{HashMap, HashSet, VecDeque};
use crate::game::badukboard::*;

#[derive(Clone, Debug, Builder)]
pub struct Baduk {
    pub(crate) board: BadukBoard,

    pub(crate) black_linked_stone_set: HashMap<u16, HashSet<u16>>,
    pub(crate) white_linked_stone_set: HashMap<u16, HashSet<u16>>,
    pub(crate) black_caught_stone: u16,
    pub(crate) white_caught_stone: u16,

    // 반복수 검사를 위한 이전 보드 상태 저장 (중국 규칙: 바로 이전 상태와 동일하면 금지)
    previous_board_state: Option<BoardState>,
    
    // 패 해소를 위한 패 위치 저장 (정확히 1개의 돌을 잡았을 때 발생)
    ko_position: Option<u16>,
    pub(crate) winner: Option<Color>,
}

/// 보드 상태를 저장하기 위한 구조체 (반복수 검사용)
#[derive(Clone, Debug, PartialEq)]
struct BoardState {
    black: [u64; 6],
    white: [u64; 6],
    turn: Color,
}

impl Baduk {
    pub fn new() -> Self {
        Self {
            board: BadukBoard::new(board_size(BoardType::Baduk)),

            black_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
            white_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
            black_caught_stone: 0,
            white_caught_stone: 0,
            
            previous_board_state: None,
            ko_position: None,

            winner: None,
        }
    }

    pub fn winner(&self) -> Option<Color> {
        self.winner.clone()
    }

    pub fn set_winner(&mut self, color: Color) {
        self.winner = Some(color);
    }

    pub fn is_board(&self) -> &BadukBoard {
        &self.board
    }

    pub fn switch_turn(&mut self) {
        self.board.switch_turn();
    }

    /// 현재 보드 상태를 BoardState로 변환
    fn get_board_state(&self) -> BoardState {
        let black_vec = self.board.bitboard_black().clone();
        let white_vec = self.board.bitboard_white().clone();
        
        // Vec<u64>를 [u64; 6]으로 변환
        let mut black_array = [0u64; 6];
        let mut white_array = [0u64; 6];
        
        for (i, &value) in black_vec.iter().take(6).enumerate() {
            black_array[i] = value;
        }
        for (i, &value) in white_vec.iter().take(6).enumerate() {
            white_array[i] = value;
        }
        
        BoardState {
            black: black_array,
            white: white_array,
            turn: self.board.is_turn(),
        }
    }

    /// 반복수(패) 검사 - 중국 규칙: 바로 이전 보드 상태와 동일하면 금지
    fn check_repetition(&self, new_state: &BoardState) -> bool {
        if let Some(prev_state) = &self.previous_board_state {
            prev_state == new_state
        } else {
            false
        }
    }

    fn adjacent_coordinates(&self, coordinate: u16) -> Vec<u16> {
        let board_size = self.board.is_boardsize();
        let mut result = Vec::with_capacity(4);
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
    ) -> (HashSet<u16>, HashSet<u16>) {
        let mut to_explore = VecDeque::from([start]);
        let mut explored = HashSet::new();
        explored.insert(start);
        let mut liberties = HashSet::new();

        while let Some(current) = to_explore.pop_front() {
            for neighbor in self.adjacent_coordinates(current) {
                let neighbor_color = self.board.is_color(neighbor);

                if neighbor_color == Color::Free {
                    liberties.insert(neighbor);
                    continue;
                }

                if neighbor_color == color && !explored.contains(&neighbor) {
                    explored.insert(neighbor);
                    to_explore.push_back(neighbor);
                }
            }
        }

        (explored, liberties)
    }

    

    fn remove_group(&mut self, stones: &HashSet<u16>, color: Color) {
        for &stone in stones {
            self.board.delete_stone(stone, color);
        }

        let captured_count = stones.len() as u16;
        match color {
            Color::Black => {
                self.white_caught_stone = self.white_caught_stone.saturating_add(captured_count);
            }
            Color::White => {
                self.black_caught_stone = self.black_caught_stone.saturating_add(captured_count);
            }
            _ => {}
        }
    }

    /// 연결된 돌 그룹을 linked_stone_set에 저장
    fn update_linked_stone_set(&mut self, group: &HashSet<u16>, color: Color) {
        let linked_set = match color {
            Color::Black => &mut self.black_linked_stone_set,
            Color::White => &mut self.white_linked_stone_set,
            _ => return,
        };

        // 그룹의 모든 돌에 대해 같은 그룹 정보를 저장
        for &stone in group {
            linked_set.insert(stone, group.clone());
        }
    }

    /// 제거된 돌 그룹을 linked_stone_set에서 삭제
    fn remove_from_linked_stone_set(&mut self, stones: &HashSet<u16>, color: Color) {
        let linked_set = match color {
            Color::Black => &mut self.black_linked_stone_set,
            Color::White => &mut self.white_linked_stone_set,
            _ => return,
        };

        for &stone in stones {
            linked_set.remove(&stone);
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

        let mut checked_opponent = HashSet::<u16>::new();
        let mut captured_any = false;
        let mut captured_single_stone_position: Option<u16> = None;
        let mut total_captured_stones = 0;

        for neighbor in self.adjacent_coordinates(coordinate) {
            if self.board.is_color(neighbor) != opponent_color {
                continue;
            }

            if checked_opponent.contains(&neighbor) {
                continue;
            }

            let (opponent_group, opponent_liberties) =
                self.collect_group_state(neighbor, opponent_color);
            checked_opponent.extend(&opponent_group);

            if opponent_liberties.is_empty() {
                // 제거 전에 linked_stone_set에서도 삭제
                self.remove_from_linked_stone_set(&opponent_group, opponent_color);
                
                // 패 위치 감지: 정확히 1개의 돌을 잡았을 때만 패 발생
                if opponent_group.len() == 1 {
                    captured_single_stone_position = opponent_group.iter().next().copied();
                    total_captured_stones = 1;
                } else {
                    // 여러 개의 돌을 잡았거나, 이미 다른 돌을 잡았으면 패가 아님
                    captured_single_stone_position = None;
                    total_captured_stones += opponent_group.len();
                }
                
                self.remove_group(&opponent_group, opponent_color);
                captured_any = true;
            }
        }
        
        // 패 위치 설정: 정확히 1개의 돌만 잡았을 때 패 발생
        if total_captured_stones == 1 {
            self.ko_position = captured_single_stone_position;
        } else {
            // 여러 개의 돌을 잡았거나 잡지 않았으면 패가 아님
            self.ko_position = None;
        }

        let (own_group, own_liberties) = self.collect_group_state(coordinate, color);
        
        // 중국 규칙 자살수 검사: 상대 돌을 잡을 수 있으면 자살수 허용
        // 자유도가 없고 상대 돌도 잡지 못한 경우에만 자살수로 판단
        if own_liberties.is_empty() && !captured_any {
            // 자살수인 경우 linked_stone_set에서도 삭제
            self.remove_from_linked_stone_set(&own_group, color);
            for stone in own_group {
                self.board.delete_stone(stone, color);
            }
            return Err(BadukBoardError::BannedChaksu);
        }

        // 자신의 그룹을 linked_stone_set에 저장
        self.update_linked_stone_set(&own_group, color);

        Ok(())
    }

    /// 빈 공간 그룹을 찾고, 그 경계를 확인하여 집을 판별
    /// 반환값: (빈 공간 그룹 좌표들, 집의 소유자 색상 - None이면 공집)
    fn identify_territory(&self, start: u16) -> (HashSet<u16>, Option<Color>) {
        let mut to_explore = VecDeque::from([start]);
        let mut explored = HashSet::new();
        explored.insert(start);
        let mut boundary_colors = HashSet::new();

        while let Some(current) = to_explore.pop_front() {
            for neighbor in self.adjacent_coordinates(current) {
                let neighbor_color = self.board.is_color(neighbor);
                
                if neighbor_color == Color::Free && !explored.contains(&neighbor) {
                    explored.insert(neighbor);
                    to_explore.push_back(neighbor);
                } else if neighbor_color == Color::Black || neighbor_color == Color::White {
                    boundary_colors.insert(neighbor_color);
                }
            }
        }

        // 경계 색상이 하나만 있으면 그 색의 집
        let territory_color = if boundary_colors.len() == 1 {
            boundary_colors.iter().next().copied()
        } else {
            None // 공집 또는 세키
        };

        (explored, territory_color)
    }

    /// 전체 보드에서 집을 계산
    /// 반환값: (흑 집 수, 백 집 수)
    pub fn calculate_territory(&self) -> (u16, u16) {
        let mut black_territory = 0;
        let mut white_territory = 0;
        let mut checked = HashSet::<u16>::new();
        let board_size = self.board.is_boardsize();

        for coord in 0..(board_size * board_size) {
            if self.board.is_free(coord) && !checked.contains(&coord) {
                let (territory_group, territory_color) = self.identify_territory(coord);
                checked.extend(&territory_group);
                
                match territory_color {
                    Some(Color::Black) => black_territory += territory_group.len() as u16,
                    Some(Color::White) => white_territory += territory_group.len() as u16,
                    Some(_) => {},
                    None => {} // 공집은 집으로 계산하지 않음
                }
            }
        }

        (black_territory, white_territory)
    }

    /// 살아있는 돌의 개수를 계산 (중국식 계가법용)
    /// 반환값: (흑 살아있는 돌 수, 백 살아있는 돌 수)
    fn count_living_stones(&self) -> (u16, u16) {
        let mut black_stones = 0;
        let mut white_stones = 0;
        let board_size = self.board.is_boardsize();

        for coord in 0..(board_size * board_size) {
            match self.board.is_color(coord) {
                Color::Black => black_stones += 1,
                Color::White => white_stones += 1,
                _ => {}
            }
        }

        (black_stones, white_stones)
    }

    /// 최종 점수 계산 (집 + 잡은 돌)
    /// 반환값: (흑 최종 점수, 백 최종 점수)
    pub fn calculate_score(&self) -> (u16, u16) {
        let (black_territory, white_territory) = self.calculate_territory();
        let (black_living_stones, white_living_stones) = self.count_living_stones();
        
        (
            black_territory + black_living_stones + self.black_caught_stone,
            white_territory + white_living_stones + self.white_caught_stone
        )
    }

    /// 디버그용: 잡은 돌 수 반환
    pub fn get_captured_stones(&self) -> (u16, u16) {
        (self.black_caught_stone, self.white_caught_stone)
    }

    /// 디버그용: 패 위치 반환
    pub fn get_ko_position(&self) -> Option<u16> {
        self.ko_position
    }

    /// 착수 시도 실패 시 Err 출력
    /// 중국 규칙 적용: 자살수는 상대 돌을 잡을 수 있으면 허용, 반복수는 금지, 패 해소 지원
    pub fn chaksu(&mut self, coordinate: u16) -> Result<(),BadukBoardError> {
        self.board.check_outboard_coordinate(coordinate)?;

        let color = self.board.is_turn();
        if !self.board.is_free(coordinate) {
            return Err(BadukBoardError::OverLap);
        }

        // 패 해소 검사: 패 위치에 돌을 두려고 할 때
        // 패는 잡힌 돌의 위치이므로, 그 위치에 다시 돌을 두려고 하면 금지
        if let Some(ko_pos) = self.ko_position {
            if coordinate == ko_pos {
                // 패 위치에 돌을 두려고 함 - 패 해소가 되었는지 확인
                // 패 해소는 상대방이 다른 곳에 수를 두면 자동으로 해소됨
                // 하지만 여전히 패 위치에 바로 두는 것은 금지 (반복수)
                return Err(BadukBoardError::BannedChaksu);
            }
        }

        // 돌을 임시로 놓고 상태 확인
        self.board.push_stone(coordinate, color);
        
        // 자살수 및 기타 규칙 검사 (돌을 놓은 상태에서 검사)
        if let Err(err) = self.resolve_after_move(coordinate, color) {
            // 에러 발생 시 돌 제거는 resolve_after_move에서 처리됨
            return Err(err);
        }

        // 착수 후 보드 상태 확인 (반복수 검사용)
        let after_state = self.get_board_state();
        
        // 반복수 검사: 착수 후 상태가 이전 턴 상태와 동일한지 확인
        // 중국 규칙: 바로 이전 턴의 보드 상태와 동일하면 금지
        if self.check_repetition(&after_state) {
            // 반복수이므로 돌을 제거하고 에러 반환
            self.board.delete_stone(coordinate, color);
            // resolve_after_move에서 추가된 linked_stone_set도 정리 필요
            let (own_group, _) = self.collect_group_state(coordinate, color);
            self.remove_from_linked_stone_set(&own_group, color);
            return Err(BadukBoardError::BannedChaksu);
        }

        // 패 해소: 패 위치가 아닌 곳에 수를 두면 패 해소
        // 패 해소는 착수 성공 후에 확인 (다른 곳에 수를 두면 패 해소)
        if let Some(ko_pos) = self.ko_position {
            if coordinate != ko_pos {
                // 패 위치가 아닌 곳에 수를 두면 패 해소
                self.ko_position = None;
            }
            // 패 위치에 수를 두려고 했지만 위에서 이미 검사했으므로 여기서는 처리하지 않음
        }

        // 착수 성공 시 현재 보드 상태를 다음 턴의 이전 상태로 저장
        self.previous_board_state = Some(after_state);
        
        self.board.switch_turn();
        Ok(())
    }

    // 집 판별(살아있는 집) - identify_territory, calculate_territory, calculate_score 함수로 구현됨

    /// 집 수 계산 및 계가
    /// 반환값: (흑 집 수, 백 집 수, 흑 최종 점수, 백 최종 점수)
    pub fn calculate_game_result(&self) -> (u16, u16, u16, u16) {
        let (black_territory, white_territory) = self.calculate_territory();
        let (black_score, white_score) = self.calculate_score();
        (black_territory, white_territory, black_score, white_score)
    }

    /// 승패 판정
    /// 반환값: Some(Color) - 승자, None - 무승부
    pub fn determine_winner(&self) -> Option<Color> {
        let (black_score, white_score) = self.calculate_score();
        
        if black_score > white_score {
            Some(Color::Black)
        } else if white_score > black_score {
            Some(Color::White)
        } else {
            None // 무승부
        }
    }
}



// TODO: 수 넘김 처리
