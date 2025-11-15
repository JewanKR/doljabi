use doljabi_engine::game::baduk;

fn main() {
    let mut test_baduk = baduk::Baduk::new();

    let black_coordinate1 = vec![60,61,62,79,80,81,98,99,100];
    
    // 60,61
    // 41,42,59,62,79,80
    // 60,61,62,79,80,81,98,99,100
    // 41,42,43,59,63,78,82,97,101,117,118,119
    let white_coordinate1 = vec![41,42,43,59,63,78,82,97,101,117,118,119];

    let len = std::cmp::max(black_coordinate1.len(), white_coordinate1.len());
    
    let mut coordinate1: Vec<u16> = black_coordinate1.into_iter().chain((0..360).rev())
        .zip(white_coordinate1.into_iter().chain((0..360).rev()))
        .take(len)
        .flat_map(|(x,y)| vec![x, y])
        .collect();


    coordinate1.push(61);

    println!("{:?}", coordinate1);
    
    for ptr in coordinate1 {
        let _ = baduk::chaksu(&mut test_baduk, ptr);
    }
}
