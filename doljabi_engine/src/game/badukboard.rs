use derive_builder::Builder;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Boardsize {
    Baduk = 19,
    Omok = 15,
}

#[derive(Debug, PartialEq)]
pub enum BadukBoardError {
    OutOfBoard,
    OverLap,
    BannedChaksu,
    InvalidArgument,
}

#[derive(Debug, Clone, Copy, PartialEq, Eq)]
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
    pub fn new() -> Self {
        Self {
            boardsize: Boardsize::Baduk as u16,
            black: [0; 6],
            white: [0; 6],
            turn: Color::Black,
        }
    }

    // 내부 요소 출력 함수
    pub fn output_bitboard_black(&self) -> Vec<u64> {
        self.black.to_vec()
    }
    pub fn output_bitboard_white(&self) -> Vec<u64> {
        self.white.to_vec()
    }
    pub fn is_turn(&self) -> Color {
        self.turn.clone()
    }
    pub fn boardsize(&self) -> u16 {
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
    // name: String,

    main_time: u64,
    start_time: u128,

    remaining_overtime: u8,
    overtime: u64,
    // match_making_rating: u16,
} impl Player {
    pub fn new(user_id: u64) -> Self {
        Self {
            user_id: user_id,
            main_time: 7200000,
            start_time: 0,
            overtime: 60000,
            remaining_overtime: 3,
        }
    }

    /*
    // player 이름 불러오기
    pub fn load_name(&mut self) {
        self.name = String::new(); // TODO: DB에서 이름 불러오기
    }

    // player MMR 불러오기
    pub fn load_match_making_rating(&mut self) {
        self.match_making_rating = self.match_making_rating; // TODO: DB에서 MMR 불러오기
    }
    */

    // 제한시간 설정
    pub fn set_remaining_time(&mut self, main_time: u64) {
        self.main_time = main_time;
    }

    // 남은 시간 계산
    pub fn calculate_remaining_time(&mut self) {
        self.main_time = self.main_time - (tokio::time::Instant::now().elapsed().as_millis() - self.start_time) as u64;
    }

    // 시작 시간 설정
    pub fn set_start_time(&mut self) {
        self.start_time = tokio::time::Instant::now().elapsed().as_millis();
    }

    // 초읽기 횟수
    pub fn set_remaining_overtime(&mut self, remaining_overtime: u8) {
        self.remaining_overtime = remaining_overtime;
    }

    // 초읽기 시간
    pub fn set_overtime(&mut self, overtime: u64) {
        self.overtime = overtime;
    }
}

#[derive(Clone, Debug, Builder)]
pub struct Players {
    black_player: Option<Player>,
    white_player: Option<Player>,
} impl Players {
    pub fn new() -> Self { Self { white_player: None, black_player: None } }

    // player 추가
    pub fn push_user(&mut self, user_id: u64) -> Result<(),()> {
        match (&self.black_player, &self.white_player) {
            (None, _) => {
                self.black_player = Some(Player::new(user_id)); Ok(())
            }
            (Some(_), None) => {
                self.white_player = Some(Player::new(user_id)); Ok(())
            }
            (Some(_), Some(_)) => {
                Err(())
            }
        }
    }

    // player 제거
    pub fn pop_user(&mut self, user_id: u64) -> Result<(), ()> {
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

        if flag {
            Ok(())
        } else {
            Err(())
        }
    }

    // 색상 스위치
    pub fn switch_color(&mut self) {
        std::mem::swap(&mut self.black_player, &mut self.white_player);
    }
}

