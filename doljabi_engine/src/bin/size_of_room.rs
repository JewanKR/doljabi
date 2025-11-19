use doljabi_engine::network::room_manager::Room;
use std::mem::size_of;

fn main() {
    println!("{}",size_of::<Room>());
    println!("{}",size_of::<u64>());
}