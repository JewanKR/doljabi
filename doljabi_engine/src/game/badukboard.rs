use derive_builder::Builder;

const BOARDSIZE: usize = 19;

#[derive(Debug, PartialEq)]
pub enum BadukBoardError {
    OutOfBoard,
    OverLap,
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Color {
    Black,
    White,
    Free,
    ColorError
}

/// xy 좌표 표현법 -> 정수 좌표 표현법 함수
pub fn xy_expression_to_integer_expression(x: u16, y: u16) -> u16 {
    y * BOARDSIZE as u16 + x
}

/// bitboard 접근 함수
pub fn coordinate_index(coordinate: u16) -> usize {
    (coordinate / 64) as usize
}
pub fn coordinatde_value(coordinate: u16) -> u64 {
    1u64 << (coordinate % 64)
}

/// 같은 열인지 확인 하는 함수
pub fn check_boundary(standard: u16, compare: u16) -> bool {
    (standard as usize / BOARDSIZE) == (compare as usize / BOARDSIZE)
}

/// 좌표 값이 0 ~ 380인지 확인 (Out Board인지 확인)
pub fn check_outboard_coordinate(coordinate: u16) -> Result<(), BadukBoardError> {
    if coordinate < 381 {Ok(())} else {Err(BadukBoardError::OutOfBoard)} 
}

#[derive(Clone, Debug)]
pub struct BadukBoard {
    black: [u64; 6],
    white: [u64; 6],
    turn: Color,

} impl BadukBoard {
    /// BadukBoard::new(); 형식으로 사용.
    pub fn new() -> Self {
        Self {
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

    /// 돌 집어 넣기
    pub fn push_stone(&mut self, coordinate: u16) {
        match self.turn {
            Color::Black => {self.black[coordinate_index(coordinate)] += coordinatde_value(coordinate)},
            Color::White => {self.white[coordinate_index(coordinate)] += coordinatde_value(coordinate)},
            _ => {println!("Error: push_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    /// 돌 제거하기
    pub fn delete_stone(&mut self, coordinate: u16) {
        match self.turn {
            Color::Black => {self.black[coordinate_index(coordinate)] -= coordinatde_value(coordinate)},
            Color::White => {self.white[coordinate_index(coordinate)] -= coordinatde_value(coordinate)},
            _ => {println!("Error: delete_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    // TODO: 턴 넘김
}

#[derive(Clone, Debug, Builder)]
pub struct Player {
    user_id: usize,
    name: String,
    color: Color,
    remaining_overtime: u8,
    timer: u64,
    overtime: u64,
    match_making_rating: u16,
} impl Player {
    pub fn new(user_id: usize) -> Self {
        Self {
            user_id: user_id,
            name: String::new(),
            color: Color::Free,
            remaining_overtime: 3,
            timer: 7200000,
            overtime: 60000,
            match_making_rating: 1500,
        }
    }

    // TODO: 색상 변경
    // TODO: 제한시간 설정
    // TODO: 초읽기 시간
    // TODO: 초읽기 횟수
    // TODO: Rating 적용
}

#[derive(Clone, Debug, Builder)]
pub struct Players {
    black_player: Option<Player>,
    white_player: Option<Player>,
} impl Players {
    pub fn new() -> Self { Self { white_player: None, black_player: None } }

    pub fn push_user(&mut self, user_id: usize) -> Result<(),()> {
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

    pub fn pop_user(&mut self, user_id: usize) -> Result<(), ()> {
        if let Some(black_user) = &self.black_player {
            if black_user.user_id == user_id {
                self.black_player = None
            }
            return Ok(());
        }

        if let Some(white_user) = &self.white_player {
            if white_user.user_id == user_id {
                self.white_player = None
            }
            return Ok(());
        }
        Err(())
    }

    // TODO: 색상 스위치
}

