use doljabi_engine::game::{omok, omok2};

fn main() {
    let mut test_omok = omok2::Omok::new();

    let black_coordinate1: Vec<u16> = vec![];
    let white_coordinate1: Vec<u16> = vec![];

    let len = std::cmp::max(black_coordinate1.len(), white_coordinate1.len());
    let len2 = len - white_coordinate1.len();
    let mut coordinate1: Vec<u16> = black_coordinate1.into_iter().chain((0..360).rev())
        .zip(white_coordinate1.into_iter().chain((0..360).rev()))
        .take(len)
        .flat_map(|(x,y)| vec![x, y])
        .collect();

    let black_coordinate2: Vec<u16> = vec![];
    let white_coordinate2: Vec<u16> = vec![0..(360-len2)];

    println!("{:?}", coordinate1);
    
    for ptr in coordinate1 {
        let _ = test_omok.chaksu(ptr);
    }

    for ptr in black_coordinate2 {
        if let Ok(_) = test_omok.chaksu(ptr) {
            for ptr2 in white_coordinate2 {
                if let Ok(_) = test_omok.chaksu(white_coordinate2.pop()) {
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