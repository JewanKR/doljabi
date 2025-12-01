// 서버 실행법> cargo run --bin debug_login_page

use axum::Router;
use utoipa_axum::router::OpenApiRouter;
use doljabi_engine::soyul::{session::SessionStore, soyul_login::login_router};

async fn debug_page(router: OpenApiRouter) {
    let (api_router, _) = router.split_for_parts();

    let app = Router::new()
        .merge(api_router);

    let server_addr = "127.0.0.1:27099";
    println!("🚀 테스트 서버 실행중: {}", server_addr);

    let listener = tokio::net::TcpListener::bind(&server_addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();

}

#[tokio::main]
async fn main() {
    let session_manazer = SessionStore::default();
    let login_router = login_router().with_state(session_manazer.clone());
    
    debug_page(login_router).await;
}
