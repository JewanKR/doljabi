use derive_builder::Builder;
use std::{collections::{HashSet}};
use crate::game::badukboard::{*};

// 방향 정의
#[derive(Clone, Copy, Debug, PartialEq, Hash, Eq)]
pub enum Direction {
    Horizontal,     // 가로
    Vertical,       // 세로
    PlueSlope,      // 양의 기울기
    MinusSlope,     // 음의 기울기
} impl Direction {
    fn four_direction() -> [Direction; 4] {[
        Direction::Horizontal,     // 가로
        Direction::Vertical,       // 세로
        Direction::PlueSlope,      // 양의 기울기
        Direction::MinusSlope,     // 음의 기울기
    ]}
}

#[derive(Clone, Debug, Builder)]
pub struct Omok {
    board: BadukBoard,
    // 게임 사항 None 이면 진행중
    winner: Option<Color>,

} impl Omok {
    pub fn new() -> Self {Self {
        board: BadukBoard::new(),
        winner: None,
    }}

    pub fn is_board(&self) -> BadukBoard {
        self.board.clone()
    }

    // 방향 크기 정의
    pub fn direction_value(&self, dir: Direction) -> u16 {
        match dir {
            Direction::Horizontal => 1,
            Direction::Vertical => self.board.boardsize(),
            Direction::PlueSlope => self.board.boardsize() - 1,
            Direction::MinusSlope => self.board.boardsize() + 1
        }
    }

    // 보드 밖으로 나갔는지 확인
    pub fn check_out_board(&self, ptr1: u16, ptr2: u16, direction: Direction) -> bool {
        // 각 좌표의 y값 받기
        let column1 = self.board.is_column(ptr1);
        let column2 = self.board.is_column(ptr2);

        // 확인 하는 방향이 가로면 같으면 true
        // 확인 하는 방향이 세로 및 대각선이면 차이가 1이면 true
        match direction {
            Direction::Horizontal => column1 == column2,
            _ => 1 == column1.abs_diff(column2)
        }
    }

    pub fn add_direction(&self, coordinate: u16, dir: Direction) -> Option<u16> {
        let dir_value = self.direction_value(dir);
        let after_coordinate = coordinate + dir_value;
        if self.check_out_board(dir_value, after_coordinate, dir) {return Some(after_coordinate);}
        None
    }

    pub fn sub_direction(&self, coordinate: u16, dir: Direction) -> Option<u16> {
        let dir_value = self.direction_value(dir);
        let after_coordinate = coordinate - dir_value;
        if self.check_out_board(after_coordinate, dir_value, dir) {return Some(after_coordinate);}
        None
    }

    pub fn is_color(&self, coordinate: u16, color: Color) -> bool { match color {
        Color::White => self.board.is_white(coordinate),
        Color::Black => self.board.is_black(coordinate),
        Color::Free => self.board.is_free(coordinate),
        _ => {eprintln!("Error: color 이상한 접근"); false}
    }}

    // 연결된 돌들의 개수을 반환하는 함수
    fn linked_stone(&self, coordinate: u16, direction: Direction, color: Color) -> u16 {
        let mut counter: u16 = 0;
        
        // 방향에 대한 크기(숫자)로 변환
        // 커지는 방향 확인
        let mut pointer = coordinate;
        while self.is_color(pointer, color) {
            counter += 1;
            if let Some(next_pointer) = self.add_direction(pointer, direction) {
                pointer = next_pointer;
            } else {
                break;
            }
        }

        // 작아지는 방향 확인
        let mut current = coordinate;
        while let Some(prev_pointer) = self.sub_direction(current, direction) {
            current = prev_pointer;
            if !self.is_color(current, color) {
                break;
            }
            counter += 1;
        }

        counter
    }

    // ---------- 33, 44 규칙을 위한 좌표 저장 ---------- //
    // 다른 좋은 방식이 있으면 사용하시면 됩니다.

    // 연결된 돌의 좌표 Vec을 반환하는 함수
    fn linked_stone_vec(&self, coordinate: u16, direction: Direction) -> Vec<u16> {
        let mut temp = Vec::<u16>::new();
        // 커지는 방향 확인
        let mut pointer = coordinate;
        while self.board.is_black(pointer) {
            // Vec에 추가
            temp.push(pointer);
            if let Some(next_pointer) = self.add_direction(pointer, direction) {
                pointer = next_pointer;
            } else {
                break;
            }
        }

        // 작아지는 방향 확인
        let mut current = coordinate;
        while let Some(prev_pointer) = self.sub_direction(current, direction) {
            current = prev_pointer;
            if !self.board.is_black(current) {
                break;
            }
            temp.push(current);
        }
        temp.sort();

        temp
    }
    
    // 연결된 돌과 한 칸 띄어진 돌의 좌표 Vec을 HashSet에 추가하는 함수
    fn linked_stone_set(&self, vecs: &mut HashSet<(Direction, Vec<u16>)>, coordinate: u16, direction: Direction) {
        let main_vec = self.linked_stone_vec(coordinate, direction);
        
        let (upcoordinate, downcoordinate) = match (main_vec.iter().max(), main_vec.iter().min()) {
            (Some(max_value), Some(min_value)) => (max_value.clone(), min_value.clone()),
            _ => (coordinate, coordinate)
        };

        match self.add_direction(upcoordinate, direction) {
            Some(next_up) if self.board.is_white(next_up) => {
                vecs.insert((direction, main_vec.clone()));
            }
            Some(next_up) => {
                let mut temp = Vec::<u16>::new();
                temp.extend(main_vec.clone());
                if let Some(next_next_up) = self.add_direction(next_up, direction) {
                    temp.extend(self.linked_stone_vec(next_next_up, direction));
                }
                temp.sort();
                vecs.insert((direction, temp));
            }
            None => {
                vecs.insert((direction, main_vec.clone()));
            }
        }

        match self.sub_direction(downcoordinate, direction) {
            Some(next_down) if self.board.is_white(next_down) => {
                vecs.insert((direction, main_vec.clone()));
            }
            Some(next_down) => {
                let mut temp = Vec::<u16>::new();
                temp.extend(main_vec.clone());
                if let Some(next_next_down) = self.sub_direction(next_down, direction) {
                    temp.extend(self.linked_stone_vec(next_next_down, direction));
                }
                temp.sort();
                vecs.insert((direction, temp));
            }
            None => {
                vecs.insert((direction, main_vec.clone()));
            }
        }
    }

    // ---------- 끝 ---------- //

    // 착수 금지 에러 처리
    fn chaksu_error(&mut self, coordinate: u16, color: Color) -> Result<(), BadukBoardError>{
        if !self.board.is_black(coordinate) {
            return Err(BadukBoardError::InvalidArgument);
        }
        self.board.delete_stone(coordinate, color);
        return Err(BadukBoardError::BannedChaksu);
    }

    /// 착수 시도 실패 시 Err 출력
    pub fn chaksu(&mut self, coordinate: u16) -> Result<(),BadukBoardError> {
        // 색상 저장 및 좌표가 비었는지 확인
        let color = self.board.is_turn();

        if self.board.is_free(coordinate) {
            return Err(BadukBoardError::OverLap);
        }

        self.board.push_stone(coordinate, color);

        // 색에 따른 규칙 적용
        match color { Color::White => {
            // 4개의 방향 검사
            for direction in Direction::four_direction() {
                // 돌 5개 이상이면 승리
                if self.linked_stone(coordinate, direction, color) >= 5 {
                    self.winner = Some(Color::White);
                    break;
                }
            }
        }

        Color::Black => {
            let mut linked_stone_list = HashSet::<(Direction, Vec<u16>)>::new();

            // 4방향 검사(각각 한 방향 씩)
            for direction in Direction::four_direction() {
                let set = self.linked_stone(coordinate, direction, color);
                // 5개 검사
                if set == 5 {
                    self.winner = Some(Color::Black);
                }
                // 5개 초과(장목) 검사
                if set > 5 {
                    return self.chaksu_error(coordinate, color);
                }

                // 돌들 좌표 추가하기
                self.linked_stone_set(&mut linked_stone_list, coordinate, direction);
            }

            let mut count3 = false;
            let mut count4 = false;
            for linked_stone in linked_stone_list {
                if self.check_3(&linked_stone) {
                    if count3 {return Err(BadukBoardError::BannedChaksu);}
                    else {count3 = true;}
                }
                if self.check_4(&linked_stone) {
                    if count4 {return Err(BadukBoardError::BannedChaksu);}
                    else {count4 = true;}
                }
            }
            // TODO: 거짓금수(중간 발표 이후)
        }
        
        _ => {return self.chaksu_error(coordinate, color);}}

        self.board.switch_turn();
        Ok(())
    }

    // TODO: 3(다음 수로 열린 4가 되는지) 채크
    fn check_3(&self, map: &(Direction, Vec<u16>)) -> bool {
        let (direction ,linked_stone) = map.clone();
        if linked_stone.len() != 3 {return false;}

        let mut check_point = HashSet::<u16>::new();

        for &stone in &linked_stone {
            if let Some(next) = self.add_direction(stone, direction) {
                check_point.insert(next);
            }
            if let Some(prev) = self.sub_direction(stone, direction) {
                check_point.insert(prev);
            }
        }
        for i in &linked_stone {
            check_point.remove(&i);
        }
        // 빈 좌표만 찾아서 새로운 set 으로 만들기
        check_point.retain(|pos| self.board.is_free(*pos));

        for i in check_point {
            let mut stone_vec = vec![i];
            stone_vec.extend(&linked_stone.clone());
            stone_vec.sort();
            if self.check_open_4(&(direction, stone_vec)) {return true;}
        }

        false
    }

    fn check_open_4(&self, map: &(Direction, Vec<u16>)) -> bool {
        let (direction ,linked_stone) = map.clone();
        let mut check_point = HashSet::<u16>::new();

        for &stone in &linked_stone {
            if let Some(next) = self.add_direction(stone, direction) {
                check_point.insert(next);
            }
            if let Some(prev) = self.sub_direction(stone, direction) {
                check_point.insert(prev);
            }
        }
        for i in &linked_stone {
            check_point.remove(&i);
        }
        // 빈 좌표만 찾아서 새로운 set 으로 만들기
        check_point.retain(|pos| self.board.is_free(*pos));
        
        let mut coutner = false;
        for i in check_point {
            let mut stone_vec = vec![i];
            stone_vec.extend(&linked_stone.clone());
            stone_vec.sort();
            if let Some(true) = self.check_5(&(direction, stone_vec)) {
                if coutner {return true;}
                else {coutner = true;}
            }
        }
        
        false
    }

    // TODO: 4(연속된 돌 4개 중 하나라도 열려있음) 채크
    fn check_4(&self, map: &(Direction, Vec<u16>)) -> bool {
        let (direction ,linked_stone) = map.clone();
        if linked_stone.len() != 4 {return false;}

        let mut check_point = HashSet::<u16>::new();

        for &stone in &linked_stone {
            if let Some(next) = self.add_direction(stone, direction) {
                check_point.insert(next);
            }
            if let Some(prev) = self.sub_direction(stone, direction) {
                check_point.insert(prev);
            }
        }
        for i in &linked_stone {
            check_point.remove(&i);
        }
        // 빈 좌표만 찾아서 새로운 set 으로 만들기
        check_point.retain(|pos| self.board.is_free(*pos));
        
        for i in check_point {
            let mut stone_vec = vec![i];
            stone_vec.extend(&linked_stone.clone());
            stone_vec.sort();
            if let Some(true) = self.check_5(&(direction, stone_vec)) {return true;}
        }
        
        false
    }

    fn check_5(&self, map: &(Direction, Vec<u16>)) -> Option<bool> {
        let (direction ,linked_stone) = map.clone();
        let is_sequence = linked_stone.windows(2).all(|window| {
            if let Some(next) = self.add_direction(window[0], direction) {
                next == window[1]
            } else {
                false
            }
        });

        if !is_sequence {
            return None;
        }

        let first = linked_stone[0];
        let last = *linked_stone.last().unwrap();

        let blocked_start = match self.sub_direction(first, direction) {
            Some(prev) => self.board.is_black(prev),
            None => false,
        };

        let blocked_end = match self.add_direction(last, direction) {
            Some(next) => self.board.is_black(next),
            None => false,
        };

        Some(!(blocked_start || blocked_end))
    }
}
