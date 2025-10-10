// 실행 방법: cargo run --bin main
use std::{collections::HashMap, net::SocketAddr, sync::Arc};
use tokio::sync::{mpsc, Mutex};
use tokio_tungstenite::{self, tungstenite::Message};
use doljabi_engine::utility::room::{room_router, room_ws};
use axum::{routing::get, Router};

// api로 오는 http 요청
fn router_list() -> Router {
    Router::new()
        .route("/", get(|| async { "Hello, World!" }))
        .nest("/room", room_router())
}

// ws로 오는 web socket 요청
fn ws_list() -> Router {
    Router::new()
        .nest("/room/:room_id", room_ws())
}


#[tokio::main]
async fn main() {
    // 로깅 초기화화
    tracing_subscriber::fmt::init();
    
    // 클라이언트 테이블 생성(수정 예정)
    //let client_table = Arc::new(Mutex::new(HashMap::<String, ClientInformation>::new()));
    //let client_table_network_key = client_table.clone();

    // 라우터 생성
    let app = Router::new()
        .nest("/api", router_list())
        .nest("/ws", ws_list());

    // 서버 주소 설정
    let addr = "127.0.0.1:27000";

    // 서버 실행
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

