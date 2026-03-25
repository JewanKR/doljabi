use std::{
    cmp::{Ordering, Reverse},
    collections::BinaryHeap,
    sync::{Arc, atomic::AtomicU16},
    time::Duration,
};

use tokio::{sync::mpsc, time::Instant};

use crate::game_logic::{InputMessage, SystemEvent};

pub struct TimeoutEvent {
    pub deadline: Instant,
    tx: mpsc::Sender<InputMessage>,
    event: Arc<AtomicU16>,
}

impl TimeoutEvent {
    async fn send(self) {
        if self.event.load(std::sync::atomic::Ordering::Relaxed) != 0 {
            let _ = self
                .tx
                .send(InputMessage::System(SystemEvent::TimerInterrupt(
                    self.event,
                )))
                .await;
        }
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

    async fn check(&mut self) {
        while let Some(is_timer) = self.list.peek() {
            if is_timer.0.deadline <= Instant::now() {
                let time_over = self.list.pop().unwrap();
                time_over.0.send().await;
            } else {
                break;
            }
        }
    }

    pub async fn run() -> mpsc::UnboundedSender<TimeoutEvent> {
        let (tx, mut set_timer) = mpsc::unbounded_channel::<TimeoutEvent>();

        let mut server_timer = Self {
            list: BinaryHeap::new(),
        };

        tokio::spawn(async move {
            loop {
                server_timer.check().await;

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
pub struct GameInterrupter {
    pub sender: mpsc::UnboundedSender<TimeoutEvent>,
    pub receiver: mpsc::Sender<InputMessage>,
}

impl GameInterrupter {
    pub fn register(&self, duration: Duration, event: u16) -> Arc<AtomicU16> {
        let atomic_u16 = Arc::new(AtomicU16::new(event));
        let _ = self.sender.send(TimeoutEvent {
            deadline: Instant::now() + duration,
            tx: self.receiver.clone(),
            event: atomic_u16.clone(),
        });
        atomic_u16
    }
    fn send_system_message(&self, system_event: SystemEvent) {
        use tokio::sync::mpsc::error::TrySendError;
        let message = InputMessage::System(system_event);

        if let Err(TrySendError::Full(returned)) = self.receiver.try_send(message) {
            let sender = self.receiver.clone();
            tokio::spawn(async move {
                let _ = sender.send(returned).await;
            });
        }
    }
    pub fn game_closer(&self) {
        self.send_system_message(SystemEvent::Close);
    }
}

pub type TimerManager = mpsc::UnboundedSender<TimeoutEvent>;
