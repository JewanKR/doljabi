use crate::game::{baduk, badukboard::Players, omok::{self, Omok}};
use axum::{Json, Router, extract::ws::Message, http::StatusCode, response::IntoResponse, routing::{delete, get, patch, post}};
use serde::{Deserialize, Serialize};
use tokio::{sync::{broadcast, mpsc}, task::JoinHandle};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};
/*
pub struct CreateOmokRoom {
    token: String,
    main_time: u64,

}

pub struct OmokRequestForm {
    token: String,
    request: OmokRequestList,
    coordinate: u16,
}

pub enum OmokRequestList {
    Chaksu = 1,
    DrawRequest = 2,
    Surrender = 3,

}

pub struct OmokRoom {
    game: Omok,
    players: Players,

    game_id: u64,
    enter_code: u16,

    room_join_channel: mpsc::Sender<u64>,
    join_result: Option<bool>,
} impl OmokRoom {
    pub fn new(game_id: u64, enter_code: u16, tx: mpsc::Sender<u64>) -> Self { Self {
        game: ,

        game_id: game_id,
        enter_code: enter_code,

        room_join_channel: tx,
        join_result: None,
    }}

    // User 접속 구현
    pub fn push_user(&mut self, user_id: u64) -> Result<(), ()> {
        self.players.push_user(user_id)
    }

    pub fn pop_user(&mut self, user_id: u64) -> Result<(), ()> {
        self.players.pop_user(user_id)
    }

    pub fn check_game_id(&self) -> u64 {
        self.game_id
    }

    pub fn check_enter_code(&self) -> u16 {
        self.enter_code
    }
    

    pub fn reset_join_result(&mut self) {
        self.join_result = None;
    }

    pub fn check_join_result(&self) -> Option<bool> {
        self.join_result
    }

    // 방 입장
    pub async fn run(&mut self, mut rx: mpsc::Receiver<u64>) {
        self.join_result = None;

        while let Some(message) = rx.recv().await {
            match self.enter_user(message) {
                Ok(()) => {self.join_result = Some(true);},
                Err(()) => {self.join_result = Some(false);},
            }
        }
    }

}

async fn create_omok() -> Result<(u64, mpsc::Sender<u64>), ()> {
    let game_id: u64 = 1;
    let enter_code: u16 = 10000;

    let omok = Omok::new(game_id, enter_code);
    let (tx_omok, mut rx_omok) = mpsc::channel::<u64>(16);
    let mut try_join_omok: Option<bool> = None;

    let room = tokio::spawn(async move{omok.run(rx_omok, &mut try_join_omok)});

    Ok(1u64, tx_omok)
}


#[utoipa::path(
    post,
    path = "api/omok/create",
    responses(
        (status = 201, description = "방 생성 성공", ),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "서버 오류"),
    )
)]
async fn create_omok_room() -> StatusCode {
    let room_id = 1;
    let (tx_room, rx_room) = mpsc::channel(65535);
    

    
    StatusCode::INTERNAL_SERVER_ERROR
}

pub fn omok_api_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(enter_omok_game))
        // .routes(routes!(leave_omok_game))
}

async fn create_omok() -> Result<(u64, mpsc::Sender<u64>), ()> {
    let game_id: u64 = 1;
    let enter_code: u16 = 10000;
    
    let (tx_omok, mut rx_omok) = mpsc::channel::<u64>(16);

    let omok = Omok::new(game_id, enter_code, tx_omok);

    let room = tokio::spawn(async move{omok.run(rx_omok)});

    Ok(1u64, tx_omok)
}


#[utoipa::path(
    post,
    path = "api/omok/create",
    responses(
        (status = 201, description = "방 생성 성공", ),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "서버 오류"),
    )
)]
async fn create_room_requset(
    Json(form): Json<CreateRoomForm>,
) -> StatusCode {
    let room_id = 1;
    let (tx_room, rx_room) = mpsc::channel(65535);
    

    
    StatusCode::INTERNAL_SERVER_ERROR
}






#[utoipa::path(
    post, // HTTP 메소드
    path = "/api/omok/enter/{game_id}", // 경로
    responses(
        // 예상되는 응답들
        (status = 200, description = "게임 입장 성공"),
        (status = 400, description = "잘못된 요청"),
        (status = 500, description = "게임 입장 오류"),
    )
)]
async fn enter_omok_game(ws: WebSocketUpgrade) -> impl IntoResponse {
    ws.on_upgrade(web_socket_handler)
}


async fn web_socket_handler(socket: WebSocket) {
    let (mut send_stream, mut read_stream) = socket.split();

    let (tx_send_stream, mut rx_send_stream) = mpsc::channel::<Message>(1024);

    // let (tx_read_stream, mut rx_read_stream) = mpsc::channel(1024);

    let (send_stop, is_stop) = oneshot::channel::<()>();

    let send_process = tokio::spawn(async move {
        tokio::select! {
            _ = async {
            while let Some(send_message) = rx_send_stream.recv().await {
                send_stream.send(send_message).await.expect("전송 오류!");
            }
            send_stream.close().await.expect("종료 오류!");
            } => {},

            _ = is_stop => {}
        }
    });

    while let Some(Ok(ws_receive_data)) = read_stream.next().await {
        match ws_receive_data {
            Message::Text(text) => {
                let receive_text = text;
            },

            Message::Binary(binary) => {
                let data = binary;
            }

            Message::Close(_) => {
                println!("websocket 연결을 종료합니다.");

                break;
            }

            Message::Ping(_) => {continue;}
            Message::Pong(_) => {continue;}
        }
    }

    // 종료 신호 보내기
    let _ = send_stop.send(());

    // process 종료 대기
    let _ = send_process.await;

}


/* 
#[utoipa::path(
    get,
    path = "api/room/list",
    responses(
        (status = 200, description = "방 리스트 송신 성공", ),
        (status = 500, description = "서버 오류"),
    )
)]
async fn room_list() -> IntoResponse {
    
}
*/



// TODO: 무승부 요청 처리
// TODO: 기권 처리

// 방 관련 라우터 설정
pub fn room_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(create_omok_room))
        //.routes(routes!(room_list))
}

        */