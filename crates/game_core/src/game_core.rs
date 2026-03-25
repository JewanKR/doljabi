use std::fmt::Display;

pub mod baduk_board;

#[derive(Clone, Copy, PartialEq, Eq, Hash, Debug)]
pub struct UserID(pub u64);

impl From<UserID> for u64 {
    fn from(value: UserID) -> Self {
        value.0
    }
}

impl From<UserID> for i64 {
    fn from(value: UserID) -> Self {
        value.0 as i64
    }
}

impl Display for UserID {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        write!(f, "{}", self.0)
    }
}
