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
impl Color {
    pub fn to_string(&self) -> String {
        match &self {
            Color::Black => "Black".to_string(),
            Color::White => "White".to_string(),
            Color::Free => "Free".to_string(),
            Color::ColorError => "Error".to_string(),
        }
    }
    pub fn reverse(self) -> Self {
        match self {
            Color::Black => Color::White,
            Color::White => Color::Black,
            Color::Free => Color::Free,
            Color::ColorError => Color::ColorError
        }
    }
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
    pub fn bitboard_black(&self) -> &[u64; 6] {
        &self.black
    }
    pub fn bitboard_white(&self) -> &[u64; 6] {
        &self.white
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
            Color::Black => {self.black[coordinate_index(coordinate)] |= coordinatde_value(coordinate)},
            Color::White => {self.white[coordinate_index(coordinate)] |= coordinatde_value(coordinate)},
            _ => {println!("Error: push_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    /// 돌 제거하기
    pub fn delete_stone(&mut self, coordinate: u16, color: Color) {
        match color {
            Color::Black => {self.black[coordinate_index(coordinate)] &= !coordinatde_value(coordinate)},
            Color::White => {self.white[coordinate_index(coordinate)] &= !coordinatde_value(coordinate)},
            _ => {println!("Error: delete_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    // 턴 넘김
    pub fn switch_turn(&mut self) {
        self.turn = self.turn.reverse();
        /* 
        match self.turn.clone() {
            Color::Black => {self.turn = Color::White;},
            Color::White => {self.turn = Color::Black;},
            _ => {println!("Error: switch_turn: 색 지정이 잘못 되었습니다.")},
        }
        */
    }
}

#[derive(Clone, Debug, Builder)]
pub struct Player {
    user_id: u64,

    main_time: u64,
    fischer_time: u64,
    remaining_overtime: u8,
    overtime: u64,

    turn_start_time: tokio::time::Instant,

    draw_offer: bool,

} impl Player {
    pub fn new(user_id: u64) -> Self {
        Self {
            user_id: user_id,
            main_time: 7200000,
            fischer_time: 0,
            overtime: 60000,
            remaining_overtime: 3,
            turn_start_time: tokio::time::Instant::now(),
            draw_offer: false,
        }
    }

    pub fn main_time(&self) -> u64 {
        self.main_time
    }

    pub fn overtime(&self) -> u64 {
        self.overtime
    }

    pub fn remain_time(&self) -> u8 {
        self.remaining_overtime
    }

    // 남은 시간 계산
    pub fn sub_main_time(&mut self) {
        self.main_time = self.main_time.saturating_sub((tokio::time::Instant::now() - self.turn_start_time).as_millis() as u64);
    }

    pub fn sub_remain_overtime(&mut self) {
        self.remaining_overtime -= 1;
    }

    // user_id 반환
    pub fn user_id(&self) -> u64 {
        self.user_id
    }

    // 유저 전체 시간 설정
    pub fn set_player(&mut self, config: &BadukBoardGameConfig) {
        let (main_time, fischer_time, remaining_overtime, overtime) = config.output();
        self.main_time = main_time;
        self.fischer_time = fischer_time;
        self.remaining_overtime = remaining_overtime;
        self.overtime = overtime;
    }

    // TODO: 시작 시간 설정
    pub fn start_turn(&mut self) {
        self.main_time += self.fischer_time;
        self.turn_start_time = tokio::time::Instant::now();
    }

    // 유저 시간 출력
    pub fn player_status(&self) -> BadukBoardGameConfig {
        BadukBoardGameConfig::new(self.main_time, self.fischer_time, self.remaining_overtime, self.overtime)
    }

    // 무승부 요청
    pub fn check_draw_offer(&self) -> bool {self.draw_offer}
    pub fn draw_offer(&mut self) {self.draw_offer = true}
    pub fn reset_draw_offer(&mut self) {self.draw_offer = false}
}

#[derive(Clone, Debug, Builder)]
pub struct Players {
    pub(crate) black_player: Option<Player>,
    pub(crate) white_player: Option<Player>,
} impl Players {
    pub fn new() -> Self { Self { white_player: None, black_player: None } }

    // player 추가
    pub fn push_user(&mut self, user_id: u64) -> bool {
        if self.black_player.as_ref().is_some_and(|p| p.user_id == user_id) {return false;}
        if self.white_player.as_ref().is_some_and(|p| p.user_id == user_id) {return false;}

        if self.black_player.is_none() {
            self.black_player = Some(Player::new(user_id));
            return true;
        }
        
        if self.white_player.is_none() {
            self.white_player = Some(Player::new(user_id));
            return true;
        }

        false
    }

    // player 제거
    pub fn pop_user(&mut self, user_id: u64) -> bool {
        let mut flag = false;

        if self.black_player.as_ref().map_or(false, |p| p.user_id == user_id) {
            self.black_player = None;
            flag = true;
        }

        if self.white_player.as_ref().map_or(false, |p| p.user_id == user_id) {
            self.white_player = None;
            flag = true;
        }

        flag
    }

    // 색상 스위치
    pub fn switch_player(&mut self) {
        std::mem::swap(&mut self.black_player, &mut self.white_player);
    }

    // 플레이어 시간 설정
    pub fn set_players(&mut self, config: &BadukBoardGameConfig) -> bool {
        let black_success = self.set_black_player(config);
        let white_success = self.set_white_player(config);
        black_success && white_success
    }

    pub fn set_black_player(&mut self, config: &BadukBoardGameConfig) -> bool {
        self.black_player.as_mut().map(|p| p.set_player(config)).is_some()
    }

    pub fn set_white_player(&mut self, config: &BadukBoardGameConfig) -> bool {
        self.white_player.as_mut().map(|p| p.set_player(config)).is_some()
    }

    pub fn turn_player(&self, turn: Color) -> Option<&Player> {
        match turn {
            Color::Black => self.black_player.as_ref(),
            Color::White => self.white_player.as_ref(),
            _ => None
        }
    }

    pub fn turn_player_mut(&mut self, turn: Color) -> Option<&mut Player> {
        match turn {
            Color::Black => self.black_player.as_mut(),
            Color::White => self.white_player.as_mut(),
            _ => None,
        }
    }

    // 플레이어 시간 출력
    pub fn black_player_state(&self) -> Option<BadukBoardGameConfig> {
        match &self.black_player {
            Some(black) => Some(black.player_status()),
            None => None
        }
    }

    pub fn white_player_state(&self) -> Option<BadukBoardGameConfig> {
        match &self.white_player {
            Some(white) => Some(white.player_status()),
            None => None
        }
    }

    pub fn full_players(&self) -> bool {
        self.black_player.is_some() && self.white_player.is_some()
    }

    pub fn check_empty_room(&self) -> bool {
        self.black_player.is_none() && self.white_player.is_none()
    }

    pub fn draw_offer(&mut self, color: &Color) {
        match &color {
            Color::Black => {self.black_player.as_mut().map(|p| p.draw_offer = true);},
            Color::White => {self.white_player.as_mut().map(|p| p.draw_offer = true);},
            _ => {}
        }
    }

    pub fn check_draw(&self) -> bool {
        self.black_player.as_ref().is_some_and(|p| p.check_draw_offer())
        && self.white_player.as_ref().is_some_and(|p| p.check_draw_offer())
    }

    pub fn reset_draw_offer(&mut self) {
        self.black_player.as_mut().map(|p| p.reset_draw_offer());
        self.white_player.as_mut().map(|p| p.reset_draw_offer());
    }

    pub fn switch_turn(&mut self, end_player: Color) -> bool {
        let (black_player, white_player) = match (&mut self.black_player, &mut self.white_player) {
            (Some(black), Some(white)) => (black, white),
            _ => {return false;}
        };

        match &end_player {
            Color::Black => {
                black_player.sub_main_time();
                white_player.start_turn();
                self.reset_draw_offer();
                true
            }
            Color::White => {
                white_player.sub_main_time();
                black_player.start_turn();
                self.reset_draw_offer();
                true
            }
            _ => false
        }        
    }

    // 색으로 id 확인
    pub fn user_id(&self, color: Color) -> Option<u64> {
        match color {
            Color::Black => self.black_player.as_ref().map(|b| b.user_id()),
            Color::White => self.white_player.as_ref().map(|w| w.user_id()),
            _ => None
        }
    }

    // id 로 색 확인
    pub fn check_id_to_color(&self, user_id: u64) -> Color {
        if let Some(player) = &self.black_player {
            if player.user_id() == user_id{return Color::Black;}
        }
        if let Some(player) = &self.white_player {
            if player.user_id() == user_id {return Color::White;}
        }
        Color::Free
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
    
    pub fn make(config: (u64, u64, u8, u64)) -> Self{Self{
        main_time: config.0,
        fischer_time: config.1,
        remaining_overtime: config.2,
        overtime: config.3,
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
