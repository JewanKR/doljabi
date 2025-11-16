/* 
use axum::{extract::{Path, State, ws::WebSocketUpgrade}, response::IntoResponse};
use hyper::StatusCode;
use serde::{Deserialize, Serialize};
use utoipa::ToSchema;
use utoipa_axum::{router::OpenApiRouter, routes};

use crate::{network::room_manager::{self, RoomManager}, soyul::session::SessionStore};

#[derive(Deserialize, Serialize, ToSchema)]
pub enum EnterRoomErrorCode {
    EnterCodeError,
    IncorrectSessionKey,
}

#[utoipa::path(
    get,
    path = "/api/room/{enter_code}/session={session_key}",
    params(
        ("enter_code" = u16, Path, description = "방 입장 코드"),
        ("session_key" = String, Path, description = "세션 키")
    ),
    responses(
        (status = 201, description = "방 입장 성공", body = u16),
        (status = 404, description = "잘못된 요청", body = EnterRoomErrorCode),
        (status = 500, description = "서버 내부 오류"),
    )
)]
pub async fn enter_room(
    ws: WebSocketUpgrade,
    Path((enter_code, session_key)): Path<(u16, String)>,
    State(room_manager): State<RoomManager>,
    State(session_store): State<SessionStore>,
) -> impl IntoResponse {

}

pub fn web_socket_upgrade_router() -> OpenApiRouter {
    OpenApiRouter::new().routes(routes!(enter_room))
}
*/