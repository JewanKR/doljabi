// 실행 방법: cargo run --bin main
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{self, tungstenite::Message};
use doljabi_engine::network::socket::{main_network, ClientInformation};

#[tokio::main]
async fn main() {
    // 로깅 초기화화
    tracing_subscriber::fmt::init();



    
    let client_table = Arc::new(Mutex::new(HashMap::<String, ClientInformation>::new()));
    let client_table_network_key = client_table.clone();

    // 서버 주소 설정
    let addr = "0.0.0.0:27000";

    // 서버 실행
    axum::Server::bind(&addr)
        .serve(app.into_make_service())
        .await
        .unwrap();

}
