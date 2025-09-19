use derive_builder::Builder;


#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Coordinate {
    col: u8,
    row: u8,
}

impl Coordinate {
    pub fn col(&self) -> usize {self.col as usize}
    pub fn row(&self) -> usize {self.row as usize}

    /// 반드시 if let이랑 같이 사용
    pub fn new(col: usize, row: usize) -> Result<Self, &'static str> {
        if col > 18 || row > 18 {
            Ok(Self{ col: col as u8, row: row as u8})
        } else {
            Err(errorcode(ErrorCode::OverFlow))
        }
    }

    pub fn overflow_check(&self) -> bool {
        if self.col > 18 || self.row > 18 {false} else {true}
    }
}


#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Color {
    Black,
    White,
    Free,
    ColorError
}


/// Player::default()를 이용해 생성
/* 사용 예시
let player_temp = Player::default()
    .name("player name".to_string)
    .color(Color::White)
    .remaining_overtime(3)
    .caught_stone(0)
    .match_making_rating(2000)
    .timer(7200000)
    .build();
 */
#[derive(Clone, Debug, Builder)]
pub struct Player {
    name: String,
    color: Color,
    remaining_overtime: u8,
    caught_stone: u16,
    match_making_rating:u16,
    timer: u128, // 시간을 밀리초 단위로 출력하면 u128로 출력됨
}


#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ErrorCode {
    OverFlow,
    OverLap,
    Undefined,
}

pub fn errorcode(error: ErrorCode) -> &'static str {
    match error {
        ErrorCode::OverFlow => "Error: OverFlow",
        ErrorCode::OverLap => "Error: OverLap",
        ErrorCode::Undefined => "Error: Undefined Error",
    }
}
