use derive_builder::Builder;
use futures_util::{SinkExt, StreamExt};
use tokio::sync::{mpsc, oneshot};
use utoipa_axum::{router::OpenApiRouter, routes};
use std::{collections::{HashSet}};
use crate::game::badukboard::{*};
use axum::{Json, Router, extract::{WebSocketUpgrade, ws::{Message, Utf8Bytes, WebSocket}}, response::IntoResponse, routing::{delete, get, patch, post}};
use hyper::StatusCode;

// 방향 정의
#[derive(Clone, Copy, Debug, PartialEq)]
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
    fn linked_stone_set(&self, vecs: &mut HashSet<Vec<u16>>, coordinate: u16, direction: Direction) -> () {
        let dir_value = self.direction_value(direction) * 2;

        let main_vec = self.linked_stone_vec(coordinate, direction);
        
        let (upcoordinate, downcoordinate) = match (main_vec.iter().max(), main_vec.iter().min()) {
            (Some(max_value), Some(min_value)) => (max_value.clone(), min_value.clone()),
            _ => (coordinate, coordinate)
        };

        let main_column = self.board.is_column(coordinate);
        let upcolumn = self.board.is_column(upcoordinate + dir_value);
        let downcolumn = self.board.is_column(downcoordinate - dir_value);

        
        if upcolumn.abs_diff(main_column) == 2 {
            let mut up_vec = self.linked_stone_vec( upcoordinate + dir_value, direction);
            up_vec.extend(main_vec.clone());
            up_vec.sort();
            (*vecs).insert(up_vec);
        }

        if downcolumn.abs_diff(main_column) == 2 {
            let mut down_vec = self.linked_stone_vec(downcoordinate - dir_value, direction);
            down_vec.extend(main_vec.clone());
            down_vec.sort();
            (*vecs).insert(down_vec);
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
            let mut linked_stone_list = HashSet::<Vec<u16>>::new();

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

            let mut count3 = 0;
            let mut count4 = 0;
            for linked_stone in linked_stone_list {
                if self.check_3(&linked_stone) {count3 += 1;}
                if self.check_4(&linked_stone) {count4 += 1;}
            }

            if count3 >= 2 {return Err(BadukBoardError::BannedChaksu);}
            if count4 >= 2 {return Err(BadukBoardError::BannedChaksu);}

            // TODO: 거짓금수(중간 발표 이후)
        }
        
        _ => {return self.chaksu_error(coordinate, color);}}

        Ok(())
    }


    // 테스트 함수
    // Vec에서 방향값을 추론하는 함수
    fn get_direction_from_vec(&self, linked_stone: &Vec<u16>) -> Option<u16> {
        if linked_stone.len() < 2 {
            return None;
        }
        
        let diff = linked_stone[1] - linked_stone[0];
        let boardsize = self.board.boardsize();
        
        if diff == 1 {
            Some(1)
        } else if diff == boardsize - 1 || diff == (boardsize - 1) * 2 {
            Some(diff)
        } else if diff == boardsize || diff == boardsize * 2 {
            Some(diff)
        } else if diff == boardsize + 1 || diff == (boardsize + 1) * 2 {
            Some(diff)
        } else if diff == 2 {
            Some(2)
        } else {
            None
        }
    }

    // dir_value로부터 base_dir 계산 (중복 제거)
    fn calculate_base_dir(&self, dir_value: u16) -> Option<u16> {
        let boardsize = self.board.boardsize();
        
        if dir_value <= 2 {
            Some(1)  // 가로
        } else if dir_value == boardsize - 1 || dir_value == (boardsize - 1) * 2 {
            Some(boardsize - 1)  // 양의 기울기
        } else if dir_value == boardsize || dir_value == boardsize * 2 {
            Some(boardsize)  // 세로
        } else if dir_value == boardsize + 1 || dir_value == (boardsize + 1) * 2 {
            Some(boardsize + 1)  // 음의 기울기
        } else {
            None
        }
    }

    // 연속된 돌인지 확인 (한 칸 띄어진 경우도 고려)
    fn is_consecutive(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() < 2 {
            return true;
        }

        let dir_value = match self.get_direction_from_vec(linked_stone) {
            Some(v) => v,
            None => return false,
        };

        let base_dir = match self.calculate_base_dir(dir_value) {
            Some(v) => v,
            None => return false,
        };

        for i in 0..linked_stone.len() - 1 {
            let diff = linked_stone[i + 1] - linked_stone[i];
            if diff != base_dir && diff != base_dir * 2 {
                return false;
            }
        }
        true
    }

    // 양쪽 끝이 비어있고 유효한지 확인 (공통 로직)
    fn check_both_ends(&self, linked_stone: &Vec<u16>, base_dir: u16) -> (bool, bool) {
        let min_coord = linked_stone[0];
        let max_coord = linked_stone[linked_stone.len() - 1];
        let board_max = self.board.boardsize() * self.board.boardsize();

        let left_open = if min_coord >= base_dir {
            self.board.is_free(min_coord - base_dir) 
                && self.check_out_board_simple(min_coord, min_coord - base_dir, base_dir)
        } else {
            false
        };

        let right_open = if max_coord + base_dir < board_max {
            self.board.is_free(max_coord + base_dir)
                && self.check_out_board_simple(max_coord, max_coord + base_dir, base_dir)
        } else {
            false
        };

        (left_open, right_open)
    }

    // 3(열린 3, 활삼): 양쪽이 모두 비어있는 3
    fn check_3(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() != 3 || !self.is_consecutive(linked_stone) {
            return false;
        }

        let dir_value = match self.get_direction_from_vec(linked_stone) {
            Some(v) => v,
            None => return false,
        };
        
        let base_dir = match self.calculate_base_dir(dir_value) {
            Some(v) => v,
            None => return false,
        };
        
        let (left_open, right_open) = self.check_both_ends(linked_stone, base_dir);
        
        left_open && right_open
    }

    // 4(열린 4, 활사): 한쪽 이상이 비어있는 4
    fn check_4(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() != 4 || !self.is_consecutive(linked_stone) {
            return false;
        }

        let dir_value = match self.get_direction_from_vec(linked_stone) {
            Some(v) => v,
            None => return false,
        };
        
        let base_dir = match self.calculate_base_dir(dir_value) {
            Some(v) => v,
            None => return false,
        };
        
        let (left_open, right_open) = self.check_both_ends(linked_stone, base_dir);
        
        left_open || right_open
    }

    // 보드 경계 체크 간단 버전 (방향값으로)
    fn check_out_board_simple(&self, ptr1: u16, ptr2: u16, dir_value: u16) -> bool {
        let column1 = self.board.is_column(ptr1);
        let column2 = self.board.is_column(ptr2);

        let boardsize = self.board.boardsize();

        // 가로 방향 체크
        if dir_value == 1 {
            return column1 == column2;
        }
        
        // 세로 방향 체크 (항상 유효)
        if dir_value == boardsize {
            return true;
        }
        
        // 대각선 방향 체크
        if dir_value == boardsize - 1 || dir_value == boardsize + 1 {
            return 1 == column1.abs_diff(column2);
        }
        
        false
    }

    /*
    // TODO: 3(다음 수로 열린 4가 되는지) 채크
    fn check_3(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() != 3 {return false;}
        // TODO: true 지우고 여기부터 작성
        true
    }

    // TODO: 4(연속된 돌 4개 중 하나라도 열려있음) 채크
    fn check_4(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() != 4 {return false;}
        // TODO: true 지우고 여기부터 작성
        true
    }
    */
}

// 현제 사항
// 흰색 완료, 검정색 5목 장목 완료,
// 33과 44 체크를 위한 Set까지 완료
// Vec에 크기가 작은 수 -> 큰 수로 정렬 됨 (Vec.sort() 매소드 이용)
// HashSet에 Vec를 넣어 중복된 Vec을 제거함
// 판별만 하면 됨




// TODO: 무승부 요청 처리
// TODO: 기권 처리


fn f1() {
    let mut test: Option<u64> = None;
    test = Some(16);
    test = None;
    
    let str2 = match f2() {
        Ok(value) => value,
        _ => "Error".to_string()
    };
}


fn f2() -> Result<String, ()> {
    Ok("파일읽기 성공".to_string())
}