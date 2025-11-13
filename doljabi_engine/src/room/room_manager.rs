use std::collections::HashSet;

pub struct EnterCodeManager {
    counter: u16,
    returned_number: HashSet<u16>,
} impl EnterCodeManager {
    pub fn new() -> Self { Self { counter: u16::max_value(), returned_number: HashSet::<u16>::new() } }

    pub fn get(&mut self) -> Result<u16, ()> {
        match self.returned_number.iter().next().cloned() {
            Some(num) => {
                self.returned_number.remove(&num);
                return Ok(num);
            }
            None => {
                if self.counter == 0 {
                    return Err(());
                }
                self.counter -= 1;
                return Ok(self.counter + 1);
            }
        }

    }
}