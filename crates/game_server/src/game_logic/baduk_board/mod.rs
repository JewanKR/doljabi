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
