use derive_builder::Builder;
use std::collections::{HashMap, HashSet};
use crate::game::badukboard::{*};

const BOARDSIZE: usize = 19; // 좌표 계산 시 필요한 바둑판 크기

#[derive(Clone, Debug, PartialEq)]
pub enum GameState {
    Playing,           // 게임 진행 중
    BlackWin,         // 흑 승리
    WhiteWin,         // 백 승리
    Draw,             // 무승부
}

#[derive(Clone, Debug, Builder)]
pub struct Omok {
    board: BadukBoard,
    players: Players,

    black_linked_stone_set: HashMap<u16, HashSet<u16>>,
    white_linked_stone_set: HashMap<u16, HashSet<u16>>,

    game_state: GameState,

} 
impl Omok {
    pub fn new() -> Self {
        Self {
            board: BadukBoard::new(),
            players: Players::new(),

            black_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),
            white_linked_stone_set: HashMap::<u16, HashSet<u16>>::new(),

            game_state: GameState::Playing,
        }
    }

    // 색상확인
    fn get_color(&self, coordinate: u16) -> Color {
        if self.board.is_black(coordinate) {
            Color::Black
        } else if self.board.is_white(coordinate) {
            Color::White
        } else {
            Color::Free
        }
    }
    
    // 방향별 돌 개수 세기
    fn count_direction(&self, coordinate: u16, direction: (i16, i16), color: Color) -> (u16, u16) {
        // coordinate를 x, y 좌표로 변환
        let x = (coordinate % BOARDSIZE as u16) as i16;
        let y = (coordinate / BOARDSIZE as u16) as i16;

        let mut forward_count = 0u16;
        let mut backward_count = 0u16;

        // forward_count
        // i를 1부터 시작해서 계속 증가
        let mut i = 1i16;
        loop {
            // 좌표계산
            let nx = x + direction.0 * i;
            let ny = y + direction.1 * i;
            
            // 경계 체크 보드 밖이면 break
            if nx < 0 || nx >= BOARDSIZE as i16 || ny < 0 || ny >= BOARDSIZE as i16 {
                break;
            }

            // nx, ny를 좌표로 변환
            let next_coord = (ny as u16) * BOARDSIZE as u16 + (nx as u16);

            // 같은 색 돌인지 확인
            if self.get_color(next_coord) == color {
                forward_count += 1;
                i += 1;
            } else {
                break;
            }
        }

        // backward_count
        let mut i = 1i16;
        // front_count와 동일
        loop {
            let nx = x - direction.0 * i;
            let ny = y - direction.1 * i;

            if nx < 0 || nx >= BOARDSIZE as i16 || ny < 0 || ny >= BOARDSIZE as i16 {
                break;
            }

            let next_coord = (ny as u16) * BOARDSIZE as u16 + (nx as u16);

            if self.get_color(next_coord) == color {
                backward_count += 1;
                i += 1;
            } else {
                break;
            }
        }

        (forward_count, backward_count)
    }

    // 열린 3 판별
    fn is_open_three(&self, coordinate: u16, direction: (i16, i16), color: Color) -> bool {
        // count_direction 함수 사용해서 돌 개수 구하기
        let (forward_count, backward_count) = self.count_direction(coordinate, direction, color);
        let total_count = forward_count + backward_count + 1;

        // 3개가 아니면 false
        if total_count != 3 {
            return false;
        }

        // 현재 X, Y의 좌표
        let x = (coordinate % BOARDSIZE as u16) as i16;
        let y = (coordinate / BOARDSIZE as u16) as i16;

        // 연결된 돌 앞 끝이 비어있는지 확인
        let front_x = x + direction.0 * (forward_count as i16 + 1);
        let front_y = y + direction.1 * (forward_count as i16 + 1);

        let front_open = if front_x >= 0 && front_x < BOARDSIZE as i16 
                         && front_y >= 0 && front_y < BOARDSIZE as i16 {
            // 2차원 -> 1차원 좌표로 변환
            let front_coord = (front_y as u16) * BOARDSIZE as u16 + (front_x as u16);
            self.get_color(front_coord) == Color::Free
        } else {
            false
        };

        // 연결된 돌 뒤 끝이 비어있는지 확인
        let back_x = x - direction.0 * (backward_count as i16 + 1);
        let back_y = y - direction.1 * (backward_count as i16 + 1);
        
        let back_open = if back_x >= 0 && back_x < BOARDSIZE as i16 
                        && back_y >= 0 && back_y < BOARDSIZE as i16 {
            // 2차원 -> 1차원 좌표로 변환
            let back_coord = (back_y as u16) * BOARDSIZE as u16 + (back_x as u16);
            self.get_color(back_coord) == Color::Free
        } else {
            false
        };

        // 양쪽이 모두 열려있으면 true
        front_open && back_open
    }

    // 3-3 금수 확인
    pub fn check_double_three(&self, coordinate: u16) -> bool {
        // 백돌은 금수 없음
        if self.board.get_turn() != Color::Black {
            return false;
        }

        // 4가지 방향 정의
        let directions = [
            (1, 0),   // 가로
            (0, 1),   // 세로
            (1, 1),   // 대각선 ↘
            (1, -1),  // 대각선 ↗
        ];

        // 열린 3의 개수를 세는 카운터 변수
        let mut open_three_count = 0u8;

        // 각 방향마다 반복문으로 확인
        for direction in directions {
            if self.is_open_three(coordinate, direction, Color::Black) {
                open_three_count += 1;
            }
        }

        // 2개 이상이면 금수
        open_three_count >= 2
    }

<<<<<<< Updated upstream
    /// 5개 연결 확인 (승리 조건)
    fn check_five_in_row(&self, coordinate: u16, color: Color) -> bool {
        // 방향 정의
        let directions = [
            (1, 0),   // 가로
            (0, 1),   // 세로
            (1, 1),   // 대각선 ↘
            (1, -1),  // 대각선 ↗
        ];
=======
            // 4방향 검사(각각 한 방향 씩)
            for direction in Direction::four_direction() {
                let set = self.linked_stone(coordinate, direction, color);
                // 5개 검사
                if set == 5 {
                    self.winner = Some(Color::Black);
                }
                // 5개 초과(장목) 검사
                if set > 5 {
                    return self.chaksu_error(coordinate, color);
                }
>>>>>>> Stashed changes

        // 각 방향 확인
        for direction in directions {
            let (forward_count, backward_count) = self.count_direction(coordinate, direction, color);
            let total_count = forward_count + backward_count + 1;
            
            // 정확히 5개 연결되면 승리
            if total_count == 5 {
                return true;
            }
            
            // 6개 이상: 백돌은 승리, 흑돌은 장목 금수
            if total_count >= 6 {
                if color == Color::White {
                    return true;  // 백돌은 장목 가능
                }
                // 흑돌의 6개 이상은 금수이므로 계속 확인
            }
        }

        false
    }

<<<<<<< Updated upstream
    // 턴 바꾸기
    pub fn switch_turn(&mut self) {
        self.board.switch_turn();
=======
    // Vec에서 방향값을 추론하는 함수
    fn get_direction_from_vec(&self, linked_stone: &Vec<u16>) -> Option<u16> {
        if linked_stone.len() < 2 {
            return None;
        }
        
        let diff = linked_stone[1] - linked_stone[0];
        let boardsize = self.board.boardsize();
        
        if diff == 1 {
            Some(1)
        } else if diff == boardsize - 1 || diff == (boardsize - 1) * 2 {
            Some(diff)
        } else if diff == boardsize || diff == boardsize * 2 {
            Some(diff)
        } else if diff == boardsize + 1 || diff == (boardsize + 1) * 2 {
            Some(diff)
        } else if diff == 2 {
            Some(2)
        } else {
            None
        }
    }

    // dir_value로부터 base_dir 계산 (중복 제거)
    fn calculate_base_dir(&self, dir_value: u16) -> Option<u16> {
        let boardsize = self.board.boardsize();
        
        if dir_value <= 2 {
            Some(1)  // 가로
        } else if dir_value == boardsize - 1 || dir_value == (boardsize - 1) * 2 {
            Some(boardsize - 1)  // 양의 기울기
        } else if dir_value == boardsize || dir_value == boardsize * 2 {
            Some(boardsize)  // 세로
        } else if dir_value == boardsize + 1 || dir_value == (boardsize + 1) * 2 {
            Some(boardsize + 1)  // 음의 기울기
        } else {
            None
        }
    }

    // 연속된 돌인지 확인 (한 칸 띄어진 경우도 고려)
    fn is_consecutive(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() < 2 {
            return true;
        }

        let dir_value = match self.get_direction_from_vec(linked_stone) {
            Some(v) => v,
            None => return false,
        };

        let base_dir = match self.calculate_base_dir(dir_value) {
            Some(v) => v,
            None => return false,
        };

        for i in 0..linked_stone.len() - 1 {
            let diff = linked_stone[i + 1] - linked_stone[i];
            if diff != base_dir && diff != base_dir * 2 {
                return false;
            }
        }
        true
    }

    // 양쪽 끝이 비어있고 유효한지 확인 (공통 로직)
    fn check_both_ends(&self, linked_stone: &Vec<u16>, base_dir: u16) -> (bool, bool) {
        let min_coord = linked_stone[0];
        let max_coord = linked_stone[linked_stone.len() - 1];
        let board_max = self.board.boardsize() * self.board.boardsize();

        let left_open = if min_coord >= base_dir {
            self.board.is_free(min_coord - base_dir) 
                && self.check_out_board_simple(min_coord, min_coord - base_dir, base_dir)
        } else {
            false
        };

        let right_open = if max_coord + base_dir < board_max {
            self.board.is_free(max_coord + base_dir)
                && self.check_out_board_simple(max_coord, max_coord + base_dir, base_dir)
        } else {
            false
        };

        (left_open, right_open)
    }

    // 3(열린 3, 활삼): 양쪽이 모두 비어있는 3
    fn check_3(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() != 3 || !self.is_consecutive(linked_stone) {
            return false;
        }

        let dir_value = match self.get_direction_from_vec(linked_stone) {
            Some(v) => v,
            None => return false,
        };
        
        let base_dir = match self.calculate_base_dir(dir_value) {
            Some(v) => v,
            None => return false,
        };
        
        let (left_open, right_open) = self.check_both_ends(linked_stone, base_dir);
        
        left_open && right_open
    }

    // 4(열린 4, 활사): 한쪽 이상이 비어있는 4
    fn check_4(&self, linked_stone: &Vec<u16>) -> bool {
        if linked_stone.len() != 4 || !self.is_consecutive(linked_stone) {
            return false;
        }

        let dir_value = match self.get_direction_from_vec(linked_stone) {
            Some(v) => v,
            None => return false,
        };
        
        let base_dir = match self.calculate_base_dir(dir_value) {
            Some(v) => v,
            None => return false,
        };
        
        let (left_open, right_open) = self.check_both_ends(linked_stone, base_dir);
        
        left_open || right_open
    }

    // 보드 경계 체크 간단 버전 (방향값으로)
    fn check_out_board_simple(&self, ptr1: u16, ptr2: u16, dir_value: u16) -> bool {
        let column1 = self.board.is_column(ptr1);
        let column2 = self.board.is_column(ptr2);

        let boardsize = self.board.boardsize();

        // 가로 방향 체크
        if dir_value == 1 {
            return column1 == column2;
        }
        
        // 세로 방향 체크 (항상 유효)
        if dir_value == boardsize {
            return true;
        }
        
        // 대각선 방향 체크
        if dir_value == boardsize - 1 || dir_value == boardsize + 1 {
            return 1 == column1.abs_diff(column2);
        }
        
        false
>>>>>>> Stashed changes
    }
    
}

/// 착수 시도 실패 시 Err 출력
pub fn chaksu(game: &mut Omok, coordinate: u16) -> Result<GameState, BadukBoardError> {
    // 1. 게임이 이미 끝났는지 확인
    if game.game_state != GameState::Playing {
        return Err(BadukBoardError::GameOver);
    }
    
    // 2. 겹침 검사
    if !game.board.is_free(coordinate) {
        return Err(BadukBoardError::OverLap);
    }
    
    // 3. 3-3 금수 검사 (흑돌만)
    if game.check_double_three(coordinate) {
        return Err(BadukBoardError::DoubleThree);
    }
    
    // TODO: 다른 착수 금지 규칙 확인하기 (4-4, 장목)
    
    // 4. 돌 놓기
    let current_turn = game.board.get_turn();
    game.board.push_stone(coordinate, current_turn);
    
    // 5. 승리 조건 확인
    if game.check_five_in_row(coordinate, current_turn) {
        game.game_state = if current_turn == Color::Black {
            GameState::BlackWin
        } else {
            GameState::WhiteWin
        };
        return Ok(game.game_state.clone());
    }
    
    // 6. 턴 전환
    game.switch_turn();
    
    // 7. 게임 계속 진행
    Ok(GameState::Playing)
}
