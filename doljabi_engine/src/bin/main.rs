// 실행 방법: cargo run --bin main
use std::{collections::HashMap, fs::{self, File}, io::Write, net::SocketAddr, sync::Arc};
use tokio::{sync::{mpsc, Mutex}};
use doljabi_engine::utility::{login::login_router};
use axum::{routing::get, Router, Json};
use utoipa::{OpenApi, ToSchema};
use utoipa_axum::{router::OpenApiRouter};

#[derive(OpenApi)]
#[openapi(
    info(
        title = "doljabi",
        version = "1.0.0",
        description = "doljabi project REST API를 정의한 문서입니다."
    )
)]
struct ApiDoc;

#[tokio::main]
async fn main() {
    
    // 클라이언트 테이블 생성(수정 예정)
    //let client_table = Arc::new(Mutex::new(HashMap::<String, ClientInformation>::new()));
    //let client_table_network_key = client_table.clone();

    // openapi 라우터
    let (api_router, openapi_doc) = router_list().split_for_parts();

    let openapi_json = openapi_doc.to_pretty_json().expect("Failed to convert openapi doc to json");
    fs::write("./src/openapi.json", openapi_json).expect("Failed to save openapi doc to json");

    // 라우터 생성
    let app = Router::new()
        .merge(api_router);

    // 서버 주소 설정
    let addr = "127.0.0.1:27000";

    // 서버 실행
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}



// api로 오는 http 요청
fn router_list() -> OpenApiRouter {
    OpenApiRouter::new()
        .merge(login_router())
        // .merge(room_router())
}