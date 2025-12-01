use std::{collections::VecDeque, time::UNIX_EPOCH};

use doljabi_engine::game::{badukboard::{BadukBoardError, Color}, omok::{self, Omok}};

fn main() {
    let mut test_omok = omok::Omok::new();

    // 기본으로 그리는 크기
    let black_coordinate1: Vec<u16> = vec![16, 25, 27, 33, 34, 56, 61, 71, 80, 81, 84, 94, 97, 112, 139, 153, 155, 159, 168, 173, 175, 189];
    let white_coordinate1: VecDeque<u16> = VecDeque::from([23, 29, 129, 219]);

    // 시도
    let black_coordinate2: Vec<u16> = vec![31, 123, 127, 187, 26, 154];
    let black: VecDeque<u16> = black_coordinate1.into_iter().chain(black_coordinate2.into_iter()).collect();

    try_chaksu(&mut test_omok, black, white_coordinate1);
}

fn try_chaksu(omok: &mut Omok, black: VecDeque<u16>, white: VecDeque<u16>) {
    let mut white_temp:VecDeque<u16> = (0..omok.is_board().is_boardsize().pow(2)).rev().collect();
    if Color::White == omok.is_board().is_turn() {
        while let Some(a) = white_temp.pop_front() {
            if let Ok(_) = omok.chaksu(a, true) {
                println!("백색: {} 착수 성공!", a);
                break;
            }
        } 
    }

    let mut main_white = white;
    main_white.extend(white_temp);
    let mut counter = 0;

    let time = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_micros();
    for ptr in black {
        counter += 1;
        match omok.chaksu(ptr, true) {
            Ok(_) => {
                println!("흑색: {} 착수 성공!", ptr);
                while let Some(ptr2) = main_white.pop_front() {
                    counter += 1;
                    if let Ok(_) = omok.chaksu(ptr2.clone(), true) {

                        println!("백색: {} 착수 성공!", ptr2);
                        break;
                    }
                }
            }
            Err(error_code) => {print_error_code(error_code, ptr);}
        }   
    }
    let time2 = std::time::SystemTime::now().duration_since(UNIX_EPOCH).unwrap().as_micros();
    println!("{}, {}", time2 - time, counter);
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