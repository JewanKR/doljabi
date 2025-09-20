use derive_builder::Builder;
use std::sync::Arc;
use crate::typelist::{*};

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
}

impl Coordinate {
    pub fn col(&self) -> usize {self.col}
    pub fn row(&self) -> usize {self.row}

    pub fn new( col: usize, row: usize) -> Result<Self, ErrorCode> {
        if col > 18 || row > 18 {
            Err(ErrorCode::OutOfBoard)
        } else {
            Ok(Self{col: col, row: row})
        }
    }
}

#[derive(Clone, Debug)]
pub struct BadukBoard {
    black: [u32; BOARDSIZE],
    white: [u32; BOARDSIZE],    
}

impl BadukBoard {
    /// BadukBoard::new(); 형식으로 사용.
    pub fn new() -> Self {
        Self {
            black: [0; BOARDSIZE],
            white: [0; BOARDSIZE],
        }
    }

    pub fn output_bitboard_black(&self) -> Vec<u32> {
        self.black.to_vec()
    }

    pub fn output_bitboard_white(&self) -> Vec<u32> {
        self.white.to_vec()
    }


    /// 돌 집어 넣기
    pub fn push_stone(&mut self, color: &Color, coordinate: &Coordinate) {
        let col = coordinate.col(); let row = coordinate.row();
        match color {
            Color::Black => {self.black[col] += 1u32<<row},
            Color::White => {self.white[col] += 1u32<<row},
            _ => {println!("Error: push_stone: 색 지정이 잘못 되었습니다.")},
        }
    }

    // TODO: 돌 제거하기

    /// 입력한 위치의 바둑돌의 색을 반환하는 함수
    pub fn check_stone_color(&self, coordinate: &Coordinate) -> Color {
        let col: usize = coordinate.col(); let row: usize = coordinate.row();
        let check_black: bool = (self.black[col] & 1u32<<row) != 0;
        let check_white: bool = (self.white[col] & 1u32<<row) != 0;

        match (check_black, check_white) {
            (true, true) => Color::ColorError,
            (true, false) => Color::Black,
            (false, true) => Color::White,
            (false, false) => Color::Free,
        }
    }

    /// 입력한 위치가 빈 공간인지 반환하는 함수
    pub fn is_free(&self, coordinate: &Coordinate) -> bool {
        let col = coordinate.col(); let row = coordinate.row();
        let check_black: bool = (self.black[col] & 1u32<<row) == 0;
        let check_white: bool = (self.white[col] & 1u32<<row) == 0;

        check_black && check_white
    }

    // TODO: 연결 된 돌 확인 및 HashMap에 저장

}

// 매치 메이킹을 위한 정보 저장
// main() 에서 HashMap 형태로 저장될 예정
/// Arc::new(User::default())를 이용해 생성
#[derive(Clone, Debug, Builder)]
pub struct User {
    id: usize,
    name: String,
    location: Location,
    match_making_rating:u16,
}

// BadukRoom에 저장될 정보
/// Player::default()를 이용해 생성
#[derive(Clone, Debug, Builder)]
pub struct Player {
    user: Arc<User>,
    color: Color,
    remaining_overtime: u8,
    caught_stone: u16,
    timer: u128,
    overtime: u128,
}

impl Player {
    pub fn new(user: Arc<User>) -> Self {
        Self {
            user: user,
            color: Color::Free,
            remaining_overtime: 3,
            caught_stone: 0,
            timer: 7200000,
            overtime: 60000,
        }
    }
}

// main() 에서 HashMap 형태로 저장될 예정
// 대기실과 게임방은 BadukRoom으로 구현
// Lobby는 BadukRoom 중 game_start == false 인 방을 표시
// 반드시 mut로 생성하기, BadukRoom::default() 로 생성하기
#[derive(Clone, Debug, Builder)]
struct BadukRoom {
    room_id: u64,
    game_start: bool,
    
    board: BadukBoard,
    white_player: Option<Player>,
    black_player: Option<Player>,

    turn: Color,
    enter_code: u16,
}

impl BadukRoom {
    pub fn new(roomid: usize) -> Self {
        Self {
            room_id: roomid as u64,
            game_start: false,
            board: BadukBoard::new(),
            white_player: None,
            black_player: None,
            turn: Color::Black,
            enter_code: 10000,
        }
    }

    // TODO: 방 설정에 구현
        // TODO: 제한시간 설정
        // TODO: 초읽기 시간
        // TODO: 초읽기 횟수
        // TODO: 흑백 선택
        // TODO: 턴
    // TODO: User 방 접속 구현
    // TODO: User 방 나가기 구현
    // TODO: 바둑 게임 시작 구현
}

// TODO: 먹히는 돌 판별
// TODO: 자살수 검사 구현
// TODO: 반복수 검사 구현

/// 착수 시도 실패 시 Err 출력
pub fn chaksu(board: &mut BadukBoard, color: &Color, col: usize, row: usize) -> Result<(),ErrorCode> {
    let coordinate = Coordinate::new(col, row)?;
    if !board.is_free(&coordinate) {return Err(ErrorCode::OverLap);}
    // TODO: 상대 돌 먹는지 확인
    // TODO: 자살수 확인
    // TODO: 반복수(패) 금지 확인
    board.push_stone(color, &coordinate);
    Ok(())
}

// TODO: 공배 규칙 적용하기
// TODO: 집 판별(살아있는 집)
// TODO: 집 수 계산 및 계가

// TODO: 무승부 요청 처리
// TODO: 기권 처리
// TODO: 수 넘김 처리

