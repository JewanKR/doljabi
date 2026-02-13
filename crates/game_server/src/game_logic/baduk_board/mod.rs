pub mod omok_room;
pub mod baduk_room;

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
