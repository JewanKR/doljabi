use std::collections::HashMap;
use std::net::SocketAddr;
use std::sync::Arc;
use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{self, tungstenite::Message};
use tokio::sync::{mpsc, Mutex};


// TODO: 클라이언트에서 온 데이터 분류하기
// TODO: 클라이언트로 보낼 정보 포장하기

pub struct ClientInformation {
    user_id: Option<u64>,
    ws_send_channel: mpsc::Sender<Message>,
} impl ClientInformation {
    pub fn new(ws_send_channel: mpsc::Sender<Message>) -> Self { Self {
        user_id: None,
        ws_send_channel: ws_send_channel,
    }}
}

pub async fn main_network(client_table: &Arc<Mutex<HashMap<String, ClientInformation>>>) {
    // TODO: 클라이언트와 통신을 위한 포트 열기
    let addr = "0.0.0.0:8080";
    let listener = TcpListener::bind(addr).await.expect("Error: TcpListener::bind !!");

    println!("server 대기 중...");

    loop {
        let (web_socket, addr) = match listener.accept().await {
            Ok(tcp) => tcp,
            Err(_) => {continue;}
        };

        let client_table_key = client_table.clone();

        tokio::spawn(async move {
            handle_client(web_socket, addr, &client_table_key).await;
        });
    }
}

async fn handle_client(tcp: TcpStream, addr: SocketAddr, client_table: &Arc<Mutex<HashMap<String, ClientInformation>>>) {
    let ws_stream = match tokio_tungstenite::accept_async(tcp).await {
        Ok(ws) => ws,
        Err(e) => {
            eprintln!("Error: Web Socket 생성 오류!, {}", e);
            return;
        }
    };

    println!("{}: 연결 성공", &addr.to_string());

    let (mut w_stream, mut r_stream) = ws_stream.split();
    // tx: 수신, rx: 송신
    let (send_tx, mut send_rx) = mpsc::channel::<Message>(65535);
    let ws_send_channel = send_tx.clone();

    client_table.lock().await.insert(addr.to_string(), ClientInformation::new(ws_send_channel));

    // 송신 프로세스: send_tx.clone().send() 으로 입력
    let send_process = tokio::spawn(async move {
        while let Some(send_message) = send_rx.recv().await {
            if w_stream.send(send_message).await.is_err() {break;}
        }
    });

    // 수신 프로세스: read_rx.recv()로 출력
    while let Some(Ok(ws_receive_data)) = r_stream.next().await {
        match ws_receive_data {

            Message::Text(text) => {
                let receive_text = text;
            },

            Message::Binary(binary) => {
                let data = binary;
            },

            Message::Ping(ping) => {
                let send_tx_key = send_tx.clone();
                if send_tx_key.send(Message::Pong(ping)).await.is_err() {break;}
            },

            Message::Close(_) => {
                println!("Close Web Socket!");  
                break;
            },

            _ => {},
        }
    };

    // client_table에서 제거
    client_table.lock().await.remove(&addr.to_string());

    // await 지점에 취소 신호를 보내 함수 종료
    send_process.abort();

    println!("{} 연결 종료!", &addr.to_string());

}
