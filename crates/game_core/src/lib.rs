use std::{
    cmp::{Ordering, Reverse},
    collections::BinaryHeap,
    time::Duration,
};

use tokio::{sync::mpsc, time::Instant};

pub mod baduk_board;

pub struct UserID(pub u64);

pub enum CommonMessage {
    TimerInterrupt,
    EnterUser(UserID),
    LeaveUser(UserID),
    GameStart,
}

pub trait GameLogic: Send + Sync {
    type InputMessage;
    type Input: From<CommonMessage> + From<Self::InputMessage>;
    type Output;

    fn send(&mut self, message: Self::Input) -> Self::Output;
}

pub struct TimeoutEvent {
    pub deadline: tokio::time::Instant,
    tx: mpsc::Sender<CommonMessage>,
}

impl TimeoutEvent {
    fn send(self) {
        let _ = self.tx.send(CommonMessage::TimerInterrupt);
    }
}

impl PartialEq for TimeoutEvent {
    fn eq(&self, other: &Self) -> bool {
        self.deadline == other.deadline
    }
}

impl Eq for TimeoutEvent {}

impl PartialOrd for TimeoutEvent {
    fn partial_cmp(&self, other: &Self) -> Option<std::cmp::Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for TimeoutEvent {
    fn cmp(&self, other: &Self) -> Ordering {
        self.deadline.cmp(&other.deadline)
    }
}

struct ServerTimer {
    list: BinaryHeap<Reverse<TimeoutEvent>>,
}

impl ServerTimer {
    pub fn register(&mut self, timeout_event: TimeoutEvent) {
        self.list.push(Reverse(timeout_event));
    }
}

pub async fn run(mut set_timer: mpsc::UnboundedReceiver<TimeoutEvent>) {
    let mut server_timer = ServerTimer {
        list: BinaryHeap::new(),
    };

    loop {
        let deadline = if let Some(is_timer) = server_timer.list.peek() {
            is_timer.0.deadline.clone()
        } else {
            Instant::now() + Duration::from_secs(u32::MAX as u64)
        };

        tokio::select! {
            Some(new_timer) = set_timer.recv() => {
                server_timer.register(new_timer);
            }

            _ = tokio::time::sleep_until(deadline) => {}
        }
    }
}
