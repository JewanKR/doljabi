use std::{
    cmp::{Ordering, Reverse},
    collections::BinaryHeap,
    time::Duration,
};

use tokio::{sync::mpsc, time::Instant};

use crate::game_logic::{InputMessage, SystemEvent};

pub struct TimeoutEvent {
    pub deadline: Instant,
    tx: mpsc::Sender<InputMessage>,
}

impl TimeoutEvent {
    fn send(self) {
        let _ = self
            .tx
            .send(InputMessage::System(SystemEvent::TimerInterrupt));
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

pub struct ServerTimer {
    list: BinaryHeap<Reverse<TimeoutEvent>>,
}

impl ServerTimer {
    fn register(&mut self, timeout_event: TimeoutEvent) {
        self.list.push(Reverse(timeout_event));
    }

    fn check(&mut self) {
        while let Some(is_timer) = self.list.peek() {
            if is_timer.0.deadline <= Instant::now() {
                let time_over = self.list.pop().unwrap();
                time_over.0.send();
            } else {
                break;
            }
        }
    }

    pub fn run() -> mpsc::UnboundedSender<TimeoutEvent> {
        let (tx, mut set_timer) = mpsc::unbounded_channel::<TimeoutEvent>();

        let mut server_timer = Self {
            list: BinaryHeap::new(),
        };

        tokio::spawn(async move {
            loop {
                server_timer.check();

                let deadline = if let Some(is_timer) = server_timer.list.peek() {
                    is_timer.0.deadline.clone()
                } else {
                    Instant::now() + Duration::from_secs(12614400000)
                };

                tokio::select! {
                    Some(new_timer) = set_timer.recv() => {
                        server_timer.register(new_timer);
                    }

                    _ = tokio::time::sleep_until(deadline) => {}
                }
            }
        });

        tx
    }
}

#[derive(Clone)]
pub struct GameTimer {
    pub sender: mpsc::UnboundedSender<TimeoutEvent>,
    pub receiver: mpsc::Sender<InputMessage>,
}

impl From<GameTimer>
    for (
        mpsc::UnboundedSender<TimeoutEvent>,
        mpsc::Sender<InputMessage>,
    )
{
    fn from(value: GameTimer) -> Self {
        (value.sender, value.receiver)
    }
}

impl GameTimer {
    pub fn register(&self, time: Duration) {
        let _ = self.sender.send(TimeoutEvent {
            deadline: Instant::now() + time,
            tx: self.receiver.clone(),
        });
    }
}

pub type TimerManager = mpsc::UnboundedSender<TimeoutEvent>;
