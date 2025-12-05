// 실행 방법: cargo run --bin main

use std::{fs, sync::Arc};

use axum::Router;
use rusqlite::Connection;
use tokio::sync::Mutex;

use doljabi_engine::soyul::{
    session::SessionStore,
    soyul_login::{admin_router, login_router, AdminState, LoginState, Db},
};

use utoipa::openapi::{ContactBuilder, OpenApi, OpenApiVersion};
use utoipa_axum::router::OpenApiRouter;

// OpenAPI 문서 기본 정보 세팅
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
    // DB 연결
    let conn = Connection::open("mydb.db").expect("DB 열기 실패");
    let db: Db = Arc::new(Mutex::new(conn));

    // 세션 매니저
    let session_manager = SessionStore::default();

    // 상태들
    let login_state = LoginState {
        db: db.clone(),
        sessions: session_manager.clone(),
    };

    let admin_state = AdminState {
        db: db.clone(),
    };

    // OpenApiRouter 생성 및 라우트 합치기
    let router_list = OpenApiRouter::new()
        .merge(login_router().with_state(login_state))
        .merge(admin_router().with_state(admin_state));

    // OpenAPI 스펙 + 실제 라우터 분리
    let (api_router, mut openapi_doc) = router_list.split_for_parts();

    // OpenAPI 문서 정보 세팅
    add_openapi_info(&mut openapi_doc);

    // OpenAPI JSON 파일로 저장
    let openapi_json = openapi_doc
        .to_pretty_json()
        .expect("Failed to convert openapi doc to json");

    fs::write("./src/openapi.json", openapi_json)
        .expect("Failed to save openapi doc to json");

    // 실제 axum Router 생성
    let app = Router::new().merge(api_router);

    // 서버 주소 설정
    let addr = "127.0.0.1:27000";
    println!("🚀 서버 실행중: {}", addr);

    // 서버 실행
    let listener = tokio::net::TcpListener::bind(&addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}
