use rkyv::util::AlignedVec;

pub struct UserID(pub u64);

pub enum GameLogicInput {
    EnterUser(UserID),
    LeaveUser(UserID),
    Message(AlignedVec),
}

pub struct GameLogicOutput(pub AlignedVec);

pub trait GameLogic: Send + Sync {
    fn send(&mut self, message: GameLogicInput) -> GameLogicOutput;
}
