use std::collections::HashMap;

use argon2::password_hash::rand_core::{OsRng, RngCore};
/* 
pub enum UserStatus {
    EnteredGame(u16),
    Lobby,
}

pub struct UserManager {
    token: HashMap<String, u64>,
    token_life_time: HashMap<String, u64>,
    status: HashMap<u64, Option<u16>>,
} impl UserManager {
    pub fn new() -> Self { Self {
        token: HashMap::new(),
        token_life_time: HashMap::new(),
        status: HashMap::new()
    }}

    pub fn get(&mut self, user_id: u64) -> Result<(), ()> {
        let mut raw_key = [0u8; 512];
        match OsRng::try_fill_bytes(&mut raw_key) {
            Ok(()) => 
        }
    }
}
    */