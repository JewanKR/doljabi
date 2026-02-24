// 실행 방법: cargo run --bin main
use axum::Router;
use game_server::{
    game_logic::{RoomManagement, create_room_router, timer::ServerTimer},
    network::socket::web_socket_upgrade_router,
    soyul::{session::SessionStore, soyul_login::login_router},
    utility::admin_page::admin_page_router,
};
use std::{fs, sync::Arc};
use tokio::sync::Mutex;
use tower_http::cors::{Any, CorsLayer};
use utoipa::openapi::{ContactBuilder, OpenApi, OpenApiVersion};
use utoipa_axum::router::OpenApiRouter;

fn add_openapi_info(openapi_doc: &mut OpenApi) {
    openapi_doc.openapi = OpenApiVersion::Version31;
    openapi_doc.info.title = "doljabi".to_string();
    openapi_doc.info.version = "1.0.0".to_string();
    openapi_doc.info.description =
        Some("doljabi project REST API를 정의한 문서입니다.".to_string());
    openapi_doc.info.license = None;
    openapi_doc.info.contact = Some(
        ContactBuilder::new()
            .name(Some("Doljabi Team"))
            .email(Some("doljabi2025@gmail.com"))
            .build(),
    );
}

#[tokio::main]
async fn main() {
    let session_manager = SessionStore::default();
    let room_manager = Arc::new(Mutex::new(RoomManagement::new()));
    let timer_manager = ServerTimer::run().await;

    // 최종 라우터 생성
    let router_list = OpenApiRouter::new()
        .merge(login_router().with_state(session_manager.clone()))
        .merge(create_room_router().with_state((room_manager.clone(), timer_manager.clone())))
        .merge(
            web_socket_upgrade_router().with_state((room_manager.clone(), session_manager.clone())),
        )
        .merge(admin_page_router());

    // openapi 명세와 라우터 분리
    let (api_router, mut openapi_doc) = router_list.split_for_parts();

    // openapi 명세 헤더 추가
    add_openapi_info(&mut openapi_doc);

    // openapi 명세를 json 파일로 출력하기
    let openapi_json = openapi_doc
        .to_pretty_json()
        .expect("Failed to convert openapi doc to json");
    fs::write("./web/openapi.json", openapi_json).expect("Failed to save openapi doc to json");

    let cors = CorsLayer::new()
        .allow_origin(Any)
        .allow_methods(Any)
        .allow_headers(Any);

    // axum 라우터 생성
    let app = Router::new().merge(api_router).layer(cors);

    // 서버 주소 설정
    let addr = "127.0.0.1:27000";
    println!("🚀 서버 실행중: {}", addr);

    // 서버 실행
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
