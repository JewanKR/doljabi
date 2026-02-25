use axum::{
    extract::{
        Path, State,
        ws::{self, WebSocketUpgrade},
    },
    http::StatusCode,
    response::IntoResponse,
};
use doljabiproto::common::{ClientToServer, ServerToClient};
use futures_util::{SinkExt, StreamExt};
use game_core::UserID;
use serde::{Deserialize, Serialize};
use std::{sync::Arc, time::Duration};
use tokio::sync::{broadcast, mpsc};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{
    game_logic::{InputMessage, RoomManager, SystemEvent},
    soyul::session::SessionStore,
};

#[derive(Deserialize, Serialize, ToSchema)]
pub enum EnterRoomErrorCode {
    EnterCodeError,
    IncorrectSessionKey,
}

#[utoipa::path(
    get,
    path = "/ws/room/{enter_code}/session/{session_key}",
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
    State((room_manager, session_store)): State<(RoomManager, SessionStore)>,
) -> impl IntoResponse {
    let is_user_id = {
        session_store
            .read()
            .await
            .get(&session_key.to_string())
            .cloned()
    };

    let user_id = match is_user_id {
        Some(user_id) => {
            #[cfg(debug_assertions)]
            println!("{} 유저 접속 성공", user_id);
            UserID::from(user_id)
        }
        None => {
            #[cfg(debug_assertions)]
            println!("session store에 유저가 없음");
            return StatusCode::BAD_REQUEST.into_response();
        }
    };

    let communication_channel = { room_manager.lock().await.get_channels(enter_code) };

    let (mpsc_tx, broadcast_rx) = match communication_channel {
        Some(channel) => channel,
        None => {
            return StatusCode::NOT_FOUND.into_response();
        }
    };

    ws.on_upgrade(move |socket| handle_websocket(socket, mpsc_tx, broadcast_rx, user_id))
}

async fn handle_websocket(
    socket: ws::WebSocket,
    mpsc_tx: mpsc::Sender<InputMessage>,
    mut broadcast_rx: broadcast::Receiver<Arc<ServerToClient>>,
    user_id: UserID,
) {
    use prost::Message as ProstMessage;
    use ws::Message;

    let (mut ws_tx, mut ws_rx) = socket.split();

    // 방 접속 시도 -> 실패 시 종료
    if let Err(_) = mpsc_tx
        .send(InputMessage::System(SystemEvent::EnterUser(user_id)))
        .await
    {
        return;
    }

    // 종료 후 종료 신호 보내기 위한 채널 확보
    let send_disconnect = mpsc_tx.clone();

    let send_task = tokio::spawn(async move {
        while let Ok(Some(message)) =
            tokio::time::timeout(Duration::from_secs(10), ws_rx.next()).await
        {
            match message {
                Ok(Message::Binary(data)) => {
                    if let Ok(request) = ClientToServer::decode(&data[..]) {
                        #[cfg(debug_assertions)]
                        println!("{:#?}", request);
                        let _ = mpsc_tx
                            .send(InputMessage::Request((user_id, request)))
                            .await;
                    }
                }

                Ok(Message::Close(_)) => {
                    #[cfg(debug_assertions)]
                    println!("websocket 종료 신호 수신");
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
            #[cfg(debug_assertions)]
            println!("{:#?}", response);
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

    let _ = send_disconnect
        .send(InputMessage::System(SystemEvent::LeaveUser(user_id)))
        .await;
}

pub fn web_socket_upgrade_router() -> OpenApiRouter<(RoomManager, SessionStore)> {
    OpenApiRouter::new().routes(routes!(enter_room))
}
