use std::net::SocketAddr;
use futures_util::{SinkExt, StreamExt};
use tokio::net::{TcpListener, TcpStream};
use tokio_tungstenite::{self, tungstenite::Message};
use tokio::io;
use tokio::sync::mpsc;


// TODO: 클라이언트에서 온 데이터 분류하기
// TODO: 클라이언트로 보낼 정보 포장하기

async fn main_network() {
    // TODO: 클라이언트와 통신을 위한 포트 열기
    let addr = "0.0.0.0:8080";
    let listener = TcpListener::bind(addr).await.expect("Error: TcpListener::bind !!");

    println!("server 대기 중...");

    loop {
        let (web_socket, addr) = match listener.accept().await {
            Ok(tcp) => tcp,
            Err(_) => {continue;}
        };

        tokio::spawn(async move {
            handle_client(web_socket, addr).await;
        });
    }
}

async fn handle_client(tcp: TcpStream, addr: SocketAddr) {
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
    let (send_tx, mut send_rx) = mpsc::channel::<Message>(32);
    let (read_tx, mut read_rx) = mpsc::channel::<Message>(32);

    // 송신 프로세스: send_tx.clone().send() 으로 입력
    let send_process = tokio::spawn(async move {
        while let Some(send_message) = send_rx.recv().await {
            if w_stream.send(send_message).await.is_err() {break;}
        }
    });

    // 수신 프로세스: read_rx.recv()로 출력
    let receive_process = tokio::spawn(async move {
        while let Some(Ok(receive_message)) = r_stream.next().await {
            if read_tx.send(receive_message).await.is_err() {break;}
        }
    });

    ////// 네트워크 API //////

    while let Some(ws_receive_data) = read_rx.recv().await {
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
    }



}
