pub mod baduk_room;
pub mod omok_room;

pub fn convert_game2proto_color(
    color: game_core::baduk_board::Color,
) -> doljabiproto::badukboard::Color {
    use doljabiproto::badukboard::Color as ProtoColor;
    use game_core::baduk_board::Color as GameColor;

    match color {
        GameColor::Black => ProtoColor::Black,
        GameColor::White => ProtoColor::White,
        GameColor::Free => ProtoColor::Free,
        GameColor::ColorError => ProtoColor::Error,
    }
}

pub fn color_i32(color: game_core::baduk_board::Color) -> i32 {
    convert_game2proto_color(color) as i32
}

pub(crate) mod timeout_event {
    pub const NONE: u16 = 0;
    pub const BRACK_GAME: u16 = 1;
    pub const PLAYER_TIMEOUT: u16 = 2;
}

/// SGF 결과(RE[]) 표기용: 색 → "B" / "W" (그 외에는 빈 문자열)
pub fn sgf_color_char(color: game_core::baduk_board::Color) -> &'static str {
    use game_core::baduk_board::Color;
    match color {
        Color::Black => "B",
        Color::White => "W",
        _ => "",
    }
}

/// 게임 종료 사유 — SGF 결과(RE[]) 문자열로 변환된다.
pub enum EndReason {
    Resign,     // 기권:       {승자}+R
    Timeout,    // 시간패:     {승자}+T
    Immediate,  // 착수 즉시 승리(오목 5목 등): {승자}+
    Score(i32), // 계가(바둑): {승자}+점수차
    Draw,       // 무승부:     Draw
}

/// 종료 사유 → SGF RE[] 문자열
pub fn sgf_result(winner: game_core::baduk_board::Color, reason: EndReason) -> String {
    match reason {
        EndReason::Draw => "Draw".to_string(),
        EndReason::Resign => format!("{}+R", sgf_color_char(winner)),
        EndReason::Timeout => format!("{}+T", sgf_color_char(winner)),
        EndReason::Immediate => format!("{}+", sgf_color_char(winner)),
        EndReason::Score(diff) => format!("{}+{}", sgf_color_char(winner), diff),
    }
}
