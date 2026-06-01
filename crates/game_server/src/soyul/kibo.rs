// kibo.rs

use game_core::baduk_board::Color;

/// 게임 종류 (SGF의 GM[] 태그를 결정)
///
/// SGF 표준(FF[4]) game number: 1 = Go(바둑), 4 = Gomoku+Renju(오목)
#[derive(Debug, Clone, Copy)]
pub enum GameKind {
    Baduk,
    Omok,
}
impl GameKind {
    fn gm_number(self) -> u8 {
        match self {
            GameKind::Baduk => 1,
            GameKind::Omok => 4,
        }
    }
    fn board_size(self) -> u8 {
        match self {
            GameKind::Baduk => 19,
            GameKind::Omok => 15,
        }
    }
}

#[derive(Debug, Clone, Copy)]
pub struct Move {
    pub color: Color,
    pub x: u8, // 0부터 시작 (0~14 → 15x15)
    pub y: u8,
}

#[derive(Debug, Clone)]
pub struct SgfGame {
    pub game_kind: GameKind,  // GM[] 태그 결정 (바둑/오목)
    pub board_size: u8,       // SZ[15] 같은 거
    pub black_player: String, // PB[]
    pub white_player: String, // PW[]
    pub result: String,       // RE[B+R] 등
    pub moves: Vec<Move>,     // 수순 리스트
}

impl SgfGame {
    /// 새 게임 생성 (게임 종류 + 보드 크기 + 흑/백 이름만 넣고 시작)
    pub fn new(game_kind: GameKind) -> Self {
        Self {
            game_kind,
            board_size: game_kind.board_size(),
            black_player: "".to_string(),
            white_player: "".to_string(),
            result: String::new(), // 처음에는 결과 없음
            moves: Vec::new(),
        }
    }

    /// 게임 결과 설정 (예: "B+R", "W+5", "Draw" 등)
    pub fn set_result(&mut self, result: &str) {
        self.result = result.to_string();
    }

    /// 종료 시점에 플레이어 이름(PB/PW)을 채워 넣기
    pub fn set_players(&mut self, black_player: &str, white_player: &str) {
        self.black_player = black_player.to_string();
        self.white_player = white_player.to_string();
    }

    /// 한 수 추가 (color, x, y)
    pub fn add_move(&mut self, color: Color, x: u8, y: u8) {
        self.moves.push(Move { color, x, y });
    }

    /// SGF 문자열로 변환해서 돌려주는 메서드
    pub fn to_sgf_string(&self) -> String {
        let mut s = String::new();

        // --- 헤더 부분 ---
        s.push_str("(;FF[4]\n"); // SGF 포맷 버전
        s.push_str(&format!("GM[{}]\n", self.game_kind.gm_number())); // 1=바둑(Go), 4=오목(Gomoku+Renju)
        s.push_str(&format!("SZ[{}]\n", self.board_size));
        s.push_str(&format!("PB[{}]\n", self.black_player));
        s.push_str(&format!("PW[{}]\n", self.white_player));

        if self.result.is_empty() {
            s.push_str("RE[?]\n"); // 결과 모름
        } else {
            s.push_str(&format!("RE[{}]\n", self.result));
        }

        s.push('\n');

        // --- 수순 부분 ---
        for m in &self.moves {
            let coord = coord_to_sgf(m.x, m.y); // ex) (0,0) -> "aa"

            match m.color {
                Color::Black => s.push_str(&format!(";B[{}]\n", coord)),
                Color::White => s.push_str(&format!(";W[{}]\n", coord)),
                _ => {} // Free, ColorError 는 기보에는 안 찍음
            }
        }

        s.push_str(")\n");
        s
    }
}

/// 0-based (x,y) → SGF 좌표 문자열 ("aa", "ab", "cc"...)
fn coord_to_sgf(x: u8, y: u8) -> String {
    let cx = (b'a' + x) as char; // 0 -> 'a', 1 -> 'b'
    let cy = (b'a' + y) as char;
    format!("{cx}{cy}")
}

use std::collections::HashMap;
use std::sync::Arc;
use tokio::sync::Mutex;

pub type GameStore = Arc<Mutex<HashMap<u16, SgfGame>>>;

#[cfg(test)]
mod tests {
    use super::*; // SgfGame, Move, Color 전부 여기서 옴

    #[test]
    fn sgf_print_test() {
        let mut game = SgfGame::new(GameKind::Baduk);

        game.add_move(Color::Black, 7, 7);
        game.add_move(Color::White, 8, 8);
        game.set_result("B+R");

        println!("===== SGF 출력 테스트 =====");
        println!("{}", game.to_sgf_string());
        println!("===========================");
    }
}
