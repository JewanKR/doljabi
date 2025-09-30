// 실행 방법: cargo run --bin main
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{self, tungstenite::Message};
use doljabi_engine::network::socket::{main_network, ClientInformation};

#[tokio::main]
async fn main() {
    let client_table = Arc::new(Mutex::new(HashMap::<String, ClientInformation>::new()));
    let client_table_network_key = client_table.clone();


    main_network(&client_table_network_key).await;

}
