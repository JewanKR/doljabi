use doljabi_engine::game::{omok};

fn main() {
    let mut test_omok = omok::Omok::new();

    let black_coordinate1: Vec<u16> = vec![];
    let white_coordinate1: Vec<u16> = vec![];

    let len = std::cmp::max(black_coordinate1.len(), white_coordinate1.len());
    let len2 = len - white_coordinate1.len();
    let coordinate1: Vec<u16> = black_coordinate1.into_iter().chain((0..360).rev())
        .zip(white_coordinate1.into_iter().chain((0..360).rev()))
        .take(len)
        .flat_map(|(x,y)| vec![x, y])
        .collect();

    let black_coordinate2: Vec<u16> = vec![];
    let mut white_coordinate2: Vec<u16> = (0..(360-len2 as u16)).collect();

    println!("{:?}", coordinate1);
    
    for ptr in coordinate1 {
        let _ = test_omok.chaksu(ptr, true);
    }

    for ptr in black_coordinate2 {
        if let Ok(_) = test_omok.chaksu(ptr, true) {
            while let Some(ptr2) = white_coordinate2.pop() {
                if let Ok(_) = test_omok.chaksu(ptr2.clone(), true) {
                    break;
                }
            }
        }
    }
}

// 60,61
// 41,42,59,62,79,80
// 60,61,62,79,80,81,98,99,100
// 41,42,43,59,63,78,82,97,101,117,118,119