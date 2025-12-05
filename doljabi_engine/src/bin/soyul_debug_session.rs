// 실행 방법: cargo run --bin debug_login_page

use axum::Router;
use utoipa_axum::router::OpenApiRouter;

use doljabi_engine::soyul::{
    session::SessionStore,
    soyul_login::login_router,
};
use doljabi_engine::utility::admin_page::admin_page_router;

async fn debug_page(router: OpenApiRouter) {
    // OpenApiRouter → (일반 axum Router, OpenApi 스펙)으로 분리
    let (api_router, _openapi) = router.split_for_parts();

    // 실제로 실행할 앱 라우터
    let app = Router::new()
        .merge(api_router);

    let server_addr = "127.0.0.1:27099";
    println!("🚀 테스트 서버 실행중: http://{server_addr}");

    let listener = tokio::net::TcpListener::bind(&server_addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[tokio::main]
async fn main() {
    let session_manager = SessionStore::default();

    // 🔹 로그인 라우터 + 관리자 라우터 같이 붙이기
    let router_list = OpenApiRouter::new()
        .merge(login_router().with_state(session_manager.clone()))
        .merge(admin_page_router()); // admin.rs에서 만든 라우터

    debug_page(router_list).await;
}
