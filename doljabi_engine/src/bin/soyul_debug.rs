use axum::Router;
use utoipa_axum::router::OpenApiRouter;
use doljabi_engine::soyul::soyul_login::login_router;
use doljabi_engine::soyul::session_store::SessionStore;

async fn debug_page(router: Router) {


    let server_addr = "127.0.0.1:27099";
    println!("🚀 테스트 서버 실행중: {}", server_addr);

    let listener = tokio::net::TcpListener::bind(&server_addr).await.unwrap();
    axum::serve(listener, router).await.unwrap();

}

#[tokio::main]
async fn main() {
    let session_store: SessionStore = SessionStore::default();
    let openapi_router = login_router().with_state(session_store.clone());

    let (api_router, _) = openapi_router.split_for_parts();

    let app = Router::new()
        .merge(api_router);


    debug_page(app).await;
}
