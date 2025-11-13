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
    players: Players,

    // 게임 사항 None 이면 진행중
    winner: Option<Color>,

} impl Omok {
    pub fn new() -> Self {Self {
        board: BadukBoard::new(),
        players: Players::new(),

        winner: None,
    }}

    pub fn is_board(&self) -> BadukBoard {
        self.board.clone()
    }

    // User 접속 구현
    pub fn push_user(&mut self, user_id: u64) -> Result<(), ()> {
        self.players.push_user(user_id)
    }

    pub fn pop_user(&mut self, user_id: u64) -> Result<(), ()> {
        self.players.pop_user(user_id)
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

    pub fn is_color(&self, coordinate: u16, color: Color) -> bool { match color {
        Color::White => self.board.is_white(coordinate),
        Color::Black => self.board.is_black(coordinate),
        Color::Free => self.board.is_free(coordinate),
        _ => {eprintln!("Error: color 이상한 접근"); false}
    }}

    // 연결된 돌들의 좌표 개수을 반환하는 함수
    fn linked_stone(&self, coordinate: u16, direction: Direction, color: Color) -> u16 {
        let mut counter: u16 = 0;
        
        // 방향에 대한 크기(숫자)로 변환
        let dir_value = self.direction_value(direction);

        // 커지는 방향 확인
        let mut pointer = coordinate;
        while self.is_color(pointer, color) {
            counter += 1;
            // 다음 좌표가 보드 밖으로 넘어가면 break
            if !(self.check_out_board(pointer, pointer + dir_value, direction)) {
                break;
            }
            pointer += dir_value;
        }

        // 작아지는 방향 확인
        pointer = coordinate - dir_value;
        while self.is_color(pointer, color) {
            counter += 1;
            if !(self.check_out_board(pointer, pointer - dir_value, direction)) {
                break;
            }
            pointer -= dir_value;
        }

        counter
    }

    // ---------- 33, 44 규칙을 위한 좌표 저장 ---------- //
    // 다른 좋은 방식이 있으면 사용하시면 됩니다.

    // 연결된 돌의 좌표 Vec을 반환하는 함수
    fn linked_stone_vec(&self, coordinate: u16, direction: Direction) -> Vec<u16> {
        let mut temp = Vec::<u16>::new();
        let dir_value = self.direction_value(direction);

        // 커지는 방향 확인
        let mut pointer = coordinate;
        while self.board.is_black(pointer) {
            // Vec에 추가
            temp.push(pointer);
            // 다음 좌표가 보드 밖으로 넘어가면 break
            if !(self.check_out_board(pointer, pointer + dir_value, direction)) {
                break;
            }
            pointer += dir_value;
        }

        // 작아지는 방향 확인
        pointer = coordinate - dir_value;
        while self.board.is_black(pointer) {
            temp.push(pointer);
            if !(self.check_out_board(pointer, pointer - dir_value, direction)) {
                break;
            }
            pointer -= dir_value;
        }
        temp.sort();

        temp
    }

    // 연결된 돌과 한 칸 띄어진 돌의 좌표 Vec을 HashSet에 추가하는 함수
    fn linked_stone_set(&self, vecs: &mut HashSet<(Direction, Vec<u16>)>, coordinate: u16, direction: Direction) {
        let main_vec = self.linked_stone_vec(coordinate, direction);
        
        let dir_value = self.direction_value(direction);
        let (upcoordinate, downcoordinate) = match (main_vec.iter().max(), main_vec.iter().min()) {
            (Some(max_value), Some(min_value)) => (max_value.clone(), min_value.clone()),
            _ => (coordinate, coordinate)
        };

        // 최대값 + 1 칸 확인
        if self.board.is_white(upcoordinate + dir_value) {
            (*vecs).insert((direction, main_vec.clone()));
        } else {
            let mut temp = Vec::<u16>::new();
            temp.extend(main_vec.clone());
            temp.extend(self.linked_stone_vec(upcoordinate + dir_value + dir_value, direction));
            temp.sort();
            (*vecs).insert((direction, temp));
        }

        // 최소값 - 1 칸 확인
        if self.board.is_white(downcoordinate - dir_value) {
            (*vecs).insert((direction, main_vec.clone()));
        } else {
            let mut temp = Vec::<u16>::new();
            temp.extend(main_vec.clone());
            temp.extend(self.linked_stone_vec(downcoordinate - dir_value - dir_value, direction));
            temp.sort();
            (*vecs).insert((direction, temp));
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
            // 1단계: 5목과 장목 먼저 검사 (우선순위 높음)
            let mut is_five = false;
            for direction in Direction::four_direction() {
                let count = self.linked_stone(coordinate, direction, color);
                
                // 5개 정확히 (승리)
                if count == 5 {
                    is_five = true;
                }
                // 6개 이상 (장목 금수)
                if count > 5 {
                    return self.chaksu_error(coordinate, color);
                }
            }

            // 5목이면 승리로 즉시 종료 (금수보다 우선)
            if is_five {
                self.winner = Some(Color::Black);
                return Ok(());
            }

            // 2단계: 패턴 수집
            let mut linked_stone_list = HashSet::<(Direction, Vec<u16>)>::new();
            for direction in Direction::four_direction() {
                self.linked_stone_set(&mut linked_stone_list, coordinate, direction);
            }

            // 3단계: 33 금수 검사 + 빈 좌표 수집
            let mut open_3_list = Vec::<(Direction, Vec<u16>, Vec<u16>)>::new(); // (방향, 돌 좌표, 빈 좌표)
            for linked_stone in &linked_stone_list {
                let (is_open_3, empty_positions) = self.check_3(linked_stone);
                if is_open_3 {
                    let (dir, vecs) = linked_stone.clone();
                    open_3_list.push((dir, vecs, empty_positions));
                }
            }

            if open_3_list.len() >= 2 {
                return Err(BadukBoardError::BannedChaksu);
            }

            // 4단계: 33의 빈 좌표를 활용한 44 금수 검사
            let mut open_4_list = Vec::<(u16, Direction, Vec<u16>)>::new(); // (빈 좌표, 4가 되는 방향, 4의 빈 좌표들)
            
            for (_dir, _stone_coords, empty_coords) in &open_3_list {
                for &empty_pos in empty_coords {
                    // 가상으로 돌 놓기
                    self.board.push_stone(empty_pos, Color::Black);
                    
                    // 이 위치에서 4개 이상 되는 방향 찾기
                    for check_dir in Direction::four_direction() {
                        let count = self.linked_stone(empty_pos, check_dir, Color::Black);
                        
                        // 정확히 4개이고 열린 4인지 확인
                        if count == 4 {
                            // 패턴 다시 수집해서 열린 4인지 체크
                            let mut temp_list = HashSet::<(Direction, Vec<u16>)>::new();
                            self.linked_stone_set(&mut temp_list, empty_pos, check_dir);
                            
                            for pattern in &temp_list {
                                let (is_open_4, four_empty_positions) = self.check_4(pattern);
                                if is_open_4 {
                                    // 4가 되는 정보 저장: (어느 좌표에 놓았을 때, 어느 방향으로, 그 4의 빈 좌표들)
                                    open_4_list.push((empty_pos, check_dir, four_empty_positions));
                                    break; // 한 방향당 한 번만 카운트
                                }
                            }
                        }
                    }
                    
                    // 돌 원복
                    self.board.delete_stone(empty_pos, Color::Black);
                }
            }

            // 44 금수 체크 전에 거짓 금수인지 확인
            if open_4_list.len() >= 2 {
                // 5단계: 거짓 44금수 검사 - 44의 빈 좌표로 5목 검사
                let mut is_fake_forbidden = false;
                
                for (four_pos, four_dir, four_empty_coords) in &open_4_list {
                    // 4를 만든 상태로 돌 놓기
                    self.board.push_stone(*four_pos, Color::Black);
                    
                    // 그 4의 빈 좌표들에 하나씩 돌을 놓아보기
                    for &empty_in_four in four_empty_coords {
                        self.board.push_stone(empty_in_four, Color::Black);
                        
                        // 5목이 되는지 체크
                        let count = self.linked_stone(empty_in_four, *four_dir, Color::Black);
                        if count == 5 {
                            // 5목이 가능하면 거짓 금수!
                            is_fake_forbidden = true;
                        }
                        
                        self.board.delete_stone(empty_in_four, Color::Black);
                        
                        if is_fake_forbidden {
                            break;
                        }
                    }
                    
                    self.board.delete_stone(*four_pos, Color::Black);
                    
                    if is_fake_forbidden {
                        break;
                    }
                }
                
                // 거짓 금수가 아니면 진짜 44금수로 처리
                if !is_fake_forbidden {
                    return Err(BadukBoardError::BannedChaksu);
                }
            }

            // TODO: 거짓 33금수 검사는 추가 구현 필요할 수 있음
        }
        
        _ => {return self.chaksu_error(coordinate, color);}}

        Ok(())
    }

    // 열린 3인지 확인하고, 열려있는 빈 좌표들을 반환
    // 반환값: (열린 3인지 여부, 빈 좌표들)
    fn check_3(&self, linked_stone: &(Direction, Vec<u16>)) -> (bool, Vec<u16>) {
        let (direction, vecs) = linked_stone.clone();
        
        // 돌이 정확히 3개가 아니면 false
        if vecs.len() != 3 {return (false, Vec::new());}
        
        let dir_value = self.direction_value(direction);
        
        // 양 끝 좌표 가져오기
        let min_coord = *vecs.first().unwrap();  // 가장 작은 좌표
        let max_coord = *vecs.last().unwrap();   // 가장 큰 좌표
        
        let mut empty_positions = Vec::<u16>::new();
        
        // 아래쪽(작은 방향)이 열려있는지 확인
        let down_check = min_coord >= dir_value && {
            let down_pos = min_coord - dir_value;
            if self.check_out_board(min_coord, down_pos, direction) && 
               self.board.is_free(down_pos) {
                empty_positions.push(down_pos);
                true
            } else {
                false
            }
        };
        
        // 위쪽(큰 방향)이 열려있는지 확인
        let up_check = {
            let up_pos = max_coord + dir_value;
            if self.check_out_board(max_coord, up_pos, direction) && 
               self.board.is_free(up_pos) {
                empty_positions.push(up_pos);
                true
            } else {
                false
            }
        };
        
        // 최소 한 쪽이라도 열려있으면 열린 3
        (down_check || up_check, empty_positions)
    }

    // 열린 4인지 확인하고, 열려있는 빈 좌표들을 반환
    // 반환값: (열린 4인지 여부, 빈 좌표들)
    fn check_4(&self, linked_stone: &(Direction, Vec<u16>)) -> (bool, Vec<u16>) {
        let (direction, vecs) = linked_stone.clone();
        
        // 돌이 정확히 4개가 아니면 false
        if vecs.len() != 4 {return (false, Vec::new());}
        
        let dir_value = self.direction_value(direction);
        
        // 양 끝 좌표 가져오기
        let min_coord = *vecs.first().unwrap();  // 가장 작은 좌표
        let max_coord = *vecs.last().unwrap();   // 가장 큰 좌표
        
        let mut empty_positions = Vec::<u16>::new();
        
        // 아래쪽(작은 방향)이 열려있는지 확인
        let down_check = min_coord >= dir_value && {
            let down_pos = min_coord - dir_value;
            if self.check_out_board(min_coord, down_pos, direction) && 
               self.board.is_free(down_pos) {
                empty_positions.push(down_pos);
                true
            } else {
                false
            }
        };
        
        // 위쪽(큰 방향)이 열려있는지 확인
        let up_check = {
            let up_pos = max_coord + dir_value;
            if self.check_out_board(max_coord, up_pos, direction) && 
               self.board.is_free(up_pos) {
                empty_positions.push(up_pos);
                true
            } else {
                false
            }
        };
        
        // 최소 한 쪽이라도 열려있으면 열린 4
        (down_check || up_check, empty_positions)
    }

}
