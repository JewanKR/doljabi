use derive_builder::Builder;

//use std::{collections::HashSet};
use crate::typelist::{*};

const BOARDSIZE: usize = 19;


/// Baduk::default()를 이용해 생성
/* 사용 예시
let Baduk1 = Baduk::default()
    .game_id("player name".to_string)
    .board(BadukBoard::new())
    .white_player(whiteplayer)
    .black_player(blackplayer)
    .overtime(60000)
    .build();
 */
#[derive(Clone, Debug, Builder)]
struct Baduk {
    game_id: u64,
    board: BadukBoard,
    white_player: Player,
    black_player: Player,
    overtime: u128,

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
        let col = coordinate.col(); let row = coordinate.row();
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

pub fn check_overflow(input: usize) -> bool {
    if input > 18 {false} else {true}
}