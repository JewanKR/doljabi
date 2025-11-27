use std::sync::Arc;
use axum::{extract::{Path, State, ws::{self, WebSocketUpgrade}}, response::IntoResponse, http::StatusCode};
use futures_util::{SinkExt, StreamExt};
use serde::{Deserialize, Serialize};
use tokio::sync::{broadcast, mpsc};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{network::room_manager::RoomManager, proto::badukboardproto::{ClientToServerRequest, ServerToClientResponse}, soyul::session::SessionStore};

#[derive(Deserialize, Serialize, ToSchema)]
pub enum EnterRoomErrorCode {
    EnterCodeError,
    IncorrectSessionKey,
}

pub struct RoomCommunicationDataForm {
    pub user_id: u64,
    pub client_to_server_request: Option<ClientToServerRequest>,
} impl RoomCommunicationDataForm {
    pub fn new(user_id: u64, client_to_server_request: Option<ClientToServerRequest>) -> Self { Self {
        user_id: user_id, client_to_server_request: client_to_server_request
    }}

    pub fn to_request(self) -> ClientToServerRequest {
        match self.client_to_server_request {
            Some(a) => a,
            None => ClientToServerRequest { session_key: "".to_string(), payload: None }
        }
    }
}

#[utoipa::path(
    get,
    path = "/api/room/{enter_code}/session/{session_key}",
    params(
        ("enter_code" = u16, Path, description = "방 입장 코드"),
        ("session_key" = String, Path, description = "세션 키")
    ),
    responses(
        (status = 101, description = "WebSocket 연결 성공: 방 입장 성공"),
        (status = 400, description = "유효하지 않은 세션 키"),
        (status = 404, description = "존재하지 않는 방"),
    )
)]
pub async fn enter_room(
    ws: WebSocketUpgrade,
    Path((enter_code, session_key)): Path<(u16, String)>,
    State((room_manager, session_store)): State<(RoomManager, SessionStore)>
) -> impl IntoResponse {
    let _user_id = {
        session_store.read().await.get(&session_key.to_string()).cloned()
    };

    let user_id = match _user_id {
        Some(user_id) => user_id,
        None => {return StatusCode::BAD_REQUEST.into_response();}
    };

    let communication_channel = {
        room_manager.lock().await.get_communication_channel(enter_code)
    };

    let (mpsc_tx, broadcast_rx) = match communication_channel {
        Some(channel) => channel,
        None => {return StatusCode::NOT_FOUND.into_response();}
    };

    ws.on_upgrade(move |socket| handle_websocket(socket, mpsc_tx, broadcast_rx, user_id))
}

async fn handle_websocket(
    socket: ws::WebSocket,
    mpsc_tx: mpsc::Sender<RoomCommunicationDataForm>,
    mut broadcast_rx: broadcast::Receiver<Arc<ServerToClientResponse>>,
    user_id: u64,
) {
    use ws::Message;
    use prost::Message as ProstMessage;

    let (mut ws_tx, mut ws_rx) = socket.split();

    // 방 접속 실패 시 종료
    if let Err(_) = mpsc_tx.send(RoomCommunicationDataForm::new(user_id, None)).await {return ;}

    let send_task = tokio::spawn(async move {
        while let Some(message) = ws_rx.next().await {
            match message {
                Ok(Message::Binary(data)) => {
                    if let Ok(request) = ClientToServerRequest::decode(&data[..]) {
                        let _ = mpsc_tx.send(RoomCommunicationDataForm::new(user_id, Some(request))).await;
                    }
                }

                Ok(Message::Close(_)) => {
                    break;
                }

                Err(_) => {
                    #[cfg(debug_assertions)]
                    eprintln!("web socket: 데이터 전송 에러");

                    break;
                }
                _ => {}
            }
        }
    });

    let recv_task = tokio::spawn(async move {
        while let Ok(response) = broadcast_rx.recv().await {
            let mut buf = Vec::new();
            if response.encode(&mut buf).is_ok() {
                let _ = ws_tx.send(Message::Binary(buf.into())).await;
            }
        }
    });

    tokio::select! {
        _ = send_task => {},
        _ = recv_task => {},
    }
}


pub fn web_socket_upgrade_router() -> OpenApiRouter<(RoomManager, SessionStore)> {
    OpenApiRouter::new().routes(routes!(enter_room))
}
