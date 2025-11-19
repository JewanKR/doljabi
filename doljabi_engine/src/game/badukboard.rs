use derive_builder::Builder;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum BoardType {
    Baduk,
    Omok,
}
pub fn board_size(board_type: BoardType) -> u16 {
    match board_type {
        BoardType::Baduk => 19,
        BoardType::Omok => 15,
    }
}

#[derive(Debug, PartialEq)]
pub enum BadukBoardError {
    OutOfBoard,
    OverLap,
    BannedChaksu,
    InvalidArgument,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Color {
    Black,
    White,
    Free,
    ColorError
}

/// bitboard 접근 함수
pub fn coordinate_index(coordinate: u16) -> usize {
    (coordinate / 64) as usize
}
pub fn coordinatde_value(coordinate: u16) -> u64 {
    1u64 << (coordinate % 64)
}

#[derive(Clone, Debug)]
pub struct BadukBoard {
    boardsize: u16,
    black: [u64; 6],
    white: [u64; 6],
    turn: Color,

} impl BadukBoard {
    /// BadukBoard::new(); 형식으로 사용.
    pub fn new(board_size: u16) -> Self {
        Self {
            boardsize: board_size,
            black: [0; 6],
            white: [0; 6],
            turn: Color::Black,
        }
    }

    // 내부 요소 출력 함수
    pub fn bitboard_black(&self) -> [u64; 6] {
        self.black.clone()
    }
    pub fn bitboard_white(&self) -> [u64; 6] {
        self.white.clone()
    }
    pub fn output_bitboard_black_vec(&self) -> Vec<u64> {
        self.black.to_vec()
    }
    pub fn output_bitboard_white_vec(&self) -> Vec<u64> {
        self.white.to_vec()
    }
    pub fn is_turn(&self) -> Color {
        self.turn.clone()
    }
    pub fn is_boardsize(&self) -> u16 {
        self.boardsize
    }

    /// xy 좌표 표현법 -> 정수 좌표 표현법 함수
    pub fn xy_expression_to_integer_expression(&self, x: u16, y: u16) -> u16 {
        y * self.boardsize as u16 + x
    }

    // 열 확인
    pub fn is_column(&self, coordinate: u16) -> usize {
        (coordinate / self.boardsize) as usize
    }

    /// 좌표 값이 0 ~ 380인지 확인 (Out Board인지 확인)
    pub fn check_outboard_coordinate(&self, coordinate: u16) -> Result<(), BadukBoardError> {
        if coordinate < (self.boardsize * self.boardsize) {Ok(())} else {Err(BadukBoardError::OutOfBoard)} 
    }

    // 돌 확인 함수
    // brack, white 있으면 true
    // free 둘 다 없으면 ture
    pub fn is_black(&self, coordinate: u16) -> bool {
        (self.black[coordinate_index(coordinate)] & coordinatde_value(coordinate)) != 0
    }
    pub fn is_white(&self, coordinate: u16) -> bool {
        (self.white[coordinate_index(coordinate)] & coordinatde_value(coordinate)) != 0
    }
    pub fn is_free(&self, coordinate: u16) -> bool {
        !(self.is_black(coordinate) || self.is_white(coordinate))
    }

    /// check_color 함수 사용 권장 (이 함수는 연산이 약 2배 많음)
    pub fn is_color(&self, coordinate: u16) -> Color {
        match (self.is_black(coordinate), self.is_white(coordinate)) {
            (true, true) => {eprintln!("Error: overlap!"); Color::ColorError},
            (true, false) => Color::Black,
            (false, true) => Color::White,
            (false, false) => Color::Free,
        }
    }

    // check_color 함수 사용 권장
    pub fn check_color(&self, coordinate: u16, color: Color) -> bool {
        match color {
            Color::Black => self.is_black(coordinate),
            Color::White => self.is_white(coordinate),
            Color::Free => self.is_free(coordinate),
            Color::ColorError => {eprintln!("Error: Check_color: 허용되지 않은 입력"); false}
        }
    }

    /// 돌 집어 넣기
    pub fn push_stone(&mut self, coordinate: u16, color: Color) {
        match color {
            Color::Black => {self.black[coordinate_index(coordinate)] += coordinatde_value(coordinate)},
            Color::White => {self.white[coordinate_index(coordinate)] += coordinatde_value(coordinate)},
            _ => {println!("Error: push_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    /// 돌 제거하기
    pub fn delete_stone(&mut self, coordinate: u16, color: Color) {
        match color {
            Color::Black => {self.black[coordinate_index(coordinate)] -= coordinatde_value(coordinate)},
            Color::White => {self.white[coordinate_index(coordinate)] -= coordinatde_value(coordinate)},
            _ => {println!("Error: delete_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    // 턴 넘김
    pub fn switch_turn(&mut self) {
        match self.turn.clone() {
            Color::Black => {self.turn = Color::White;},
            Color::White => {self.turn = Color::Black;},
            _ => {println!("Error: switch_turn: 색 지정이 잘못 되었습니다.")},
        }
    }
}

#[derive(Clone, Debug, Builder)]
pub struct Player {
    user_id: u64,

    main_time: u64,
    fischer_time: u64,
    remaining_overtime: u8,
    overtime: u64,

    set_start_time: u128,

} impl Player {
    pub fn new(user_id: u64) -> Self {
        Self {
            user_id: user_id,
            main_time: 7200000,
            fischer_time: 0,
            overtime: 60000,
            remaining_overtime: 3,
            set_start_time: 0,
        }
    }

    // 제한시간 설정
    pub fn set_remaining_time(&mut self, main_time: u64) {
        self.main_time = main_time;
    }

    // 남은 시간 계산
    pub fn calculate_remaining_time(&mut self) {
        self.main_time = self.main_time - (tokio::time::Instant::now().elapsed().as_millis() - self.set_start_time) as u64;
    }

    // 시작 시간 설정
    pub fn set_start_time(&mut self) {
        self.set_start_time = tokio::time::Instant::now().elapsed().as_millis();
    }

    // 초읽기 횟수
    pub fn set_remaining_overtime(&mut self, remaining_overtime: u8) {
        self.remaining_overtime = remaining_overtime;
    }

    // 초읽기 시간
    pub fn set_overtime(&mut self, overtime: u64) {
        self.overtime = overtime;
    }

    pub fn set_fischer_time(&mut self, fischer_time: u64) {
        self.fischer_time = fischer_time;
    }

    pub fn set_player(&mut self, config: &BadukBoardGameConfig) {
        let (main_time, fischer_time, remaining_overtime, overtime) = config.output();
        self.set_remaining_time(main_time);
        self.set_fischer_time(fischer_time);
        self.set_remaining_overtime(remaining_overtime);
        self.set_overtime(overtime);
    }

    pub fn player_status(&self) -> BadukBoardGameConfig { BadukBoardGameConfig::new(
        self.main_time, self.fischer_time, self.remaining_overtime, self.overtime
    )}
}

#[derive(Clone, Debug, Builder)]
pub struct Players {
    black_player: Option<Player>,
    white_player: Option<Player>,
} impl Players {
    pub fn new() -> Self { Self { white_player: None, black_player: None } }

    // player 추가
    pub fn push_user(&mut self, user_id: u64) -> bool {
        match (&self.black_player, &self.white_player) {
            (None, _) => { self.black_player = Some(Player::new(user_id)); true }
            (Some(_), None) => { self.white_player = Some(Player::new(user_id)); true }
            (Some(_), Some(_)) => false
        }
    }

    // player 제거
    pub fn pop_user(&mut self, user_id: u64) -> bool {
        let mut flag = false;

        if let Some(black_user) = &self.black_player {
            if black_user.user_id == user_id {
                self.black_player = None;
                flag = true;
            }
        }

        if let Some(white_user) = &self.white_player {
            if white_user.user_id == user_id {
                self.white_player = None;
                flag = true;
            }
        }

        flag
    }

    // 색상 스위치
    pub fn switch_color(&mut self) {
        std::mem::swap(&mut self.black_player, &mut self.white_player);
    }

    // 플레이어 시간 설정정
    pub fn set_players(&mut self, config: &BadukBoardGameConfig) -> bool {
        let black_success = self.set_black_player(config);
        let white_success = self.set_white_player(config);
        black_success && white_success
    }

    pub fn set_black_player(&mut self, config: &BadukBoardGameConfig) -> bool {
        match &mut self.black_player {
            Some(player) => {player.set_player(config); true},
            None => false,
        }
    }

    // 플레이어 시간 출력
    pub fn set_white_player(&mut self, config: &BadukBoardGameConfig) -> bool {
        match &mut self.white_player {
            Some(player) => {player.set_player(config); true},
            None => false,
        }
    }

    pub fn black_player_state(&self) -> BadukBoardGameConfig {
        match &self.black_player {
            Some(black) => black.player_status(),
            None => BadukBoardGameConfig::empty()
        }
    }

    pub fn white_player_state(&self) -> BadukBoardGameConfig {
        match &self.white_player {
            Some(white) => white.player_status(),
            None => BadukBoardGameConfig::empty()
        }
    }

    pub fn check_emtpy_room(&self) -> bool {
        match (&self.black_player, &self.white_player) {
            (None, None) => true,
            _ => false
        }
    }
}

#[derive(Deserialize, Serialize, ToSchema, Clone, Copy)]
pub struct BadukBoardGameConfig {
    main_time: u64,
    fischer_time: u64,
    remaining_overtime: u8,
    overtime: u64,
} impl BadukBoardGameConfig {
    pub fn new(main_time: u64, fischer_time: u64, remaining_overtime: u8, overtime: u64) -> Self { Self {
        main_time: main_time,
        fischer_time: fischer_time,
        remaining_overtime: remaining_overtime,
        overtime: overtime,
    }}

    pub fn output(&self) -> (u64, u64, u8, u64) {(
        self.main_time,
        self.fischer_time,
        self.remaining_overtime,
        self.overtime
    )}

    pub fn empty() -> Self { Self {
        main_time: 0,
        fischer_time: 0,
        remaining_overtime: 0,
        overtime: 0,
    }}
}
