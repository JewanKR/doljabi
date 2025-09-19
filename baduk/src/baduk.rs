use derive_builder::Builder;

const BOARDSIZE: usize = 19;

#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Color {
    Black,
    White,
    Free,
    ColorError
}

#[derive(Clone, Copy, Debug, PartialEq)]
pub struct Coordinate {
    col: usize,
    row: usize,
    selected: bool,
    determine: bool,
}

impl Coordinate {
    pub fn new() -> Self {Self { col: 0, row: 0, selected: false, determine: false }}
    pub fn col(&self) -> usize {self.col}
    pub fn row(&self) -> usize {self.row}

    /// if let이랑 같이 사용
    pub fn aim(&mut self, col: usize, row: usize) -> bool {
        if col > 18 || row > 18 {
            self.col = col;
            self.row = row;
            self.selected = true;
            true
        } else {
            self.reset();
            false
        }
    }

    pub fn reset(&mut self) {
        self.selected = false;
        self.col = 0;
        self.row = 0;
        self.determine = false;
    }
}

#[derive(Clone, Debug, Builder)]
pub struct User {
    id: usize,
    name: String,
    location: u64,
    match_making_rating:u16,
}

/// Player::default()를 이용해 생성
#[derive(Clone, Debug, Builder)]
pub struct Player {
    user_id: User,
    color: Color,
    remaining_overtime: u8,
    caught_stone: u16,
    timer: u128,
    overtime: u128,
}

impl Player {
    pub fn new(userid: User) -> Self {
        Self {
            user_id: userid,
            color: Color::Free,
            remaining_overtime: 3,
            caught_stone: 0,
            timer: 7200000,
            overtime: 60000,
        }
    }
}

#[derive(Clone, Debug, Builder)]
struct BadukRoom {
    room_id: u64,
    game_start: bool,

    board: BadukBoard,
    white_player: Option<Player>,
    black_player: Option<Player>,

    coordinate: Coordinate,
}

impl BadukRoom {
    pub fn new(roomid: usize) -> Self {
        Self {
            room_id: roomid as u64,
            game_start: false,
            board: BadukBoard::new(),
            white_player: None,
            black_player: None,
            coordinate: Coordinate::new(),
        }
    }
    /* 
    pub fn baduk_start() {
        
    }*/
}



#[derive(Clone, Debug)]
pub struct BadukBoard {
    black: [u32; BOARDSIZE],
    white: [u32; BOARDSIZE],    
}

impl BadukBoard {
    // 구조체 생성 및 초기값 넣기
    /// let mut A = BadukBoard::new(); 형식으로 사용.
    pub fn new() -> Self {
        Self {
            black: [0; BOARDSIZE],
            white: [0; BOARDSIZE],
        }
    }

    /// 입력한 위치의 바둑돌의 색을 반환하는 함수
    pub fn check_stone_color(&self, coordinate: &Coordinate) -> Color {
        let col: usize = coordinate.col(); let row: usize = coordinate.row();
        let check_black: bool = (self.black[col] & 1u32<<row) != 0;
        let check_white: bool = (self.white[col] & 1u32<<row) != 0;

        match (check_black, check_white) {
            (true, true) => {println!("{}",errorcode(ErrorCode::OverLap)); Color::ColorError},
            (true, false) => Color::Black,
            (false, true) => Color::White,
            (false, false) => Color::Free,
        }
    }

    /// 입력한 위치가 빈 공간인지 반환하는 함수
    pub fn check_free_space(&mut self, coordinate: &Coordinate) -> bool {
        let col = coordinate.col(); let row = coordinate.row();
        let check_black: bool = (self.black[col] & 1u32<<row) == 0;
        let check_white: bool = (self.white[col] & 1u32<<row) == 0;

        if check_black && check_white {true} else {false}
    }

    /// 돌 집어 넣기
    pub fn push_stone(&mut self, color: Color, coordinate: &Coordinate) {
        let col = coordinate.col(); let row = coordinate.row();
        match color {
            Color::Black => {self.black[col] += 1u32<<row},
            Color::White => {self.white[col] += 1u32<<row},
            _ => {println!("Error: push_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    /// 콘솔에 바둑판 그리기
    pub fn print_borad(&self) {
        let mut black = self.black.clone();
        let mut white = self.white.clone();

        let mut ccolumn = String::new();

        for i in 0..19 {
            for _ in 0..19 {
                if black[i] & 1u32 == 1 {ccolumn.push_str("[B] ");}
                else if white[i] & 1u32 == 1 {ccolumn.push_str("[W] ");}
                else {ccolumn.push_str("[ ] ");}
                black[i] = black[i] >> 1;
                white[i] = white[i] >> 1;
            }
            println!("{}", ccolumn);
        }
    }

    pub fn output_bitboard_black(&self) -> Vec<u32> {
        self.black.to_vec()
    }

    pub fn output_bitboard_white(&self) -> Vec<u32> {
        self.white.to_vec()
    }

    
    /* 
    /// 착수
    pub fn chaksu_check(&mut self, color:Color, coordinate: &Coordinate) {
        if self.check_free_space(col, row) {}
    }





    
    /// 흰색 검정색 겹침 확인
    pub fn stone_overlap_debug(&self) -> Option<ErrorCode> {
        for i in 0..19 {
            if self.black[i] & self.white[i] != 0 {
                return Some(ErrorCode::OverLap);
            }
        }
        return None;
    }
    */

    /* 
    /// 연결 된 돌 확인
    pub fn linked_stone(&self, coordinate: &Coordinate) {
        
    }

    /// 죽은 돌 판별
    pub fn captured_stone() {

    }
  */

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