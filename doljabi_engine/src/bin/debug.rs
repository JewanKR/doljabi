// 실행 방법: cargo run --bin debug
use doljabi_engine::game::baduk::{self, Baduk};
use doljabi_engine::game::omok::{self, Omok};
use doljabi_engine::game::badukboard::{self, BadukBoard, Player, Players, Color};

fn main() {
    println!("--- Debugging game structs and methods ---");

    // 1. badukboard::BadukBoard and related functions
    println!("\n--- Testing badukboard::BadukBoard ---");
    let mut board = BadukBoard::new();
    println!("New board created: {:?}", board);

    let coord1 = badukboard::xy_expression_to_integer_expression(3, 3);
    let coord2 = badukboard::xy_expression_to_integer_expression(10, 10);

    println!("\nPushing black stone at (3, 3) -> coord {}", coord1);
    board.push_stone(coord1);
    println!("Board state: {:?}", board);
    println!("Is (3,3) black? {}", board.is_black(coord1));
    println!("Is (3,3) free? {}", board.is_free(coord1));

    // TODO: Implement turn switching to test white stone placement
    // Manually changing turn for debugging purposes
    // board.turn = Color::White;
    // println!("\nPushing white stone at (10, 10) -> coord {}", coord2);
    // board.push_stone(coord2);
    // println!("Board state: {:?}", board);
    // println!("Is (10,10) white? {}", board.is_white(coord2));

    println!("\nDeleting black stone at (3, 3)");
    board.delete_stone(coord1);
    println!("Board state: {:?}", board);
    println!("Is (3,3) free now? {}", board.is_free(coord1));

    // 2. badukboard::Player and badukboard::Players
    println!("\n--- Testing badukboard::Player & Players ---");
    let mut players = Players::new();
    println!("New Players struct: {:?}", players);

    println!("\nAdding player with user_id 1001");
    players.push_user(1001).unwrap();
    println!("Players state: {:?}", players);

    println!("Adding player with user_id 2002");
    players.push_user(2002).unwrap();
    println!("Players state: {:?}", players);

    println!("Trying to add a third player (should fail)");
    let result = players.push_user(3003);
    println!("Result: {:?}", result);

    println!("\nRemoving player with user_id 1001");
    players.pop_user(1001).unwrap();
    println!("Players state: {:?}", players);

    // 3. baduk::Baduk
    println!("\n--- Testing baduk::Baduk ---");
    let mut baduk_game = Baduk::new();
    println!("New Baduk game: {:?}", baduk_game);

    println!("\nAttempting valid chaksu (move) at coord 15, 15");
    let baduk_coord = badukboard::xy_expression_to_integer_expression(15, 15);
    let result = baduk::chaksu(&mut baduk_game, baduk_coord);
    println!("Chaksu result: {:?}", result);
    println!("Baduk game state: {:?}", baduk_game);

    println!("\nAttempting overlapping chaksu at coord 15, 15 (should fail)");
    let result = baduk::chaksu(&mut baduk_game, baduk_coord);
    println!("Chaksu result: {:?}", result);
    println!("Baduk game state: {:?}", baduk_game);


    // 4. omok::Omok
    println!("\n--- Testing omok::Omok ---");
    let mut omok_game = Omok::new();
    println!("New Omok game: {:?}", omok_game);

    println!("\nAttempting valid chaksu (move) at coord 5, 5");
    let omok_coord = badukboard::xy_expression_to_integer_expression(5, 5);
    let result = omok::chaksu(&mut omok_game, omok_coord);
    println!("Chaksu result: {:?}", result);
    println!("Omok game state: {:?}", omok_game);

    println!("\nAttempting overlapping chaksu at coord 5, 5 (should fail)");
    let result = omok::chaksu(&mut omok_game, omok_coord);
    println!("Chaksu result: {:?}", result);
    println!("Omok game state: {:?}", omok_game);

    println!("\n--- Debugging finished ---");
}
