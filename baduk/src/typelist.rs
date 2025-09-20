#[derive(Clone, Copy, Debug, PartialEq)]
pub enum ErrorCode {
    OutOfBoard,
    OverLap,
    OverFlow,
    Undefined,
}


#[derive(Clone, Copy, Debug, PartialEq)]
pub enum Location {
    Lobby,
    Room,
    Game,
}