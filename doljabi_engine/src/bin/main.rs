// 실행 방법: cargo run --bin main
use std::{collections::HashMap, fs, net::SocketAddr, sync::Arc};
use tokio::{sync::{mpsc, Mutex}};
use doljabi_engine::utility::{admin_page::admin_page_router, login::login_router};
use axum::{Router, Json};
use utoipa::{ToSchema, openapi::{self, ContactBuilder, OpenApi, OpenApiVersion}};
use utoipa_axum::{router::OpenApiRouter};
use utoipa_swagger_ui::SwaggerUi;

// api로 오는 http 요청
fn router_list() -> OpenApiRouter {
    OpenApiRouter::new()
        .merge(login_router())
        .merge(admin_page_router())
        //.merge(room_router())
}

fn add_openapi_info(openapi_doc: &mut OpenApi) {
    openapi_doc.openapi = OpenApiVersion::Version31;
    openapi_doc.info.title = "doljabi".to_string();
    openapi_doc.info.version = "1.0.0".to_string();
    openapi_doc.info.description = Some("doljabi project REST API를 정의한 문서입니다.".to_string());
    openapi_doc.info.license = None;
    openapi_doc.info.contact = Some(
        ContactBuilder::new()
            .name(Some("Doljabi Team"))
            .email(Some("doljabi2025@gmail.com"))
            .build()
    );
}

#[tokio::main]
async fn main() {
    // openapi 라우터
    let (api_router, mut openapi_doc) = router_list().split_for_parts();

    add_openapi_info(&mut openapi_doc);

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
