use std::collections::{VecDeque};
use doljabi_engine::game::{baduk::{Baduk, chaksu}, badukboard::{BadukBoardError}};

fn main() {
    let mut test_baduk = Baduk::new();

    // 기본으로 그리는 크기
    let black_coordinate: VecDeque<u16> = VecDeque::from([]);
    let white_coordinate: VecDeque<u16> = VecDeque::from([]);

    try_chaksu(&mut test_baduk, black_coordinate, white_coordinate);
}

fn try_chaksu(baduk: &mut Baduk, black_coordinate: VecDeque<u16>, white_coordinate: VecDeque<u16>) {
    let temp_coordinate: VecDeque<u16> = (0..baduk.is_board().is_boardsize().pow(2)).rev().collect();

    let mut black = black_coordinate;
    black.extend(temp_coordinate.clone());

    let mut white = white_coordinate;
    white.extend(temp_coordinate);

    while let Some(ptr) = black.pop_front() {
        match chaksu(baduk, ptr) {
            Ok(_) => {
                println!("흑색: {} 착수 성공!", ptr);
                while let Some(ptr2) = white.pop_front() {
                    if let Ok(_) = chaksu(baduk, ptr2) {
                        println!("백색: {} 착수 성공!", ptr2);
                        break;
                    }
                }
            }
            Err(error_code) => {print_error_code(error_code, ptr);}
        }
    }
}

fn print_error_code(error_code: BadukBoardError, ptr: u16) {
    match error_code {
        BadukBoardError::BannedChaksu => {println!("{} 착수 실패: 착수 금지", ptr);}
        BadukBoardError::OutOfBoard => {println!("{} 착수 실패: 보드 밖 참조",ptr);}
        BadukBoardError::OverLap => {println!("{} 착수 실패: 돌 겹침", ptr);}
        BadukBoardError::InvalidArgument => {println!("{} 착수 실패: 잘못된 인수", ptr);}
    }
}

// 60,61
// 41,42,59,62,79,80
// 60,61,62,79,80,81,98,99,100
// 41,42,43,59,63,78,82,97,101,117,118,119