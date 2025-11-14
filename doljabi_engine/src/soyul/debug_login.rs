/*
use axum::Router;
use doljabi_engine::utility::login;
use utoipa_axum::router::OpenApiRouter;
use utoipa_swagger_ui::SwaggerUi;

async fn debug_page(router: OpenApiRouter) {
    let (api_router, openapi) = router.split_for_parts();

    let app = Router::new()
        .merge(api_router)
        .merge(
            SwaggerUi::new("/docs")
                .url("/api-docs/openapi.json", openapi)
        );

    let addr = "127.0.0.1:27099";
    println!("🚀 Debug server running at: http://{}", addr);
    println!("📚 Swagger UI: http://{}/docs", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

#[tokio::main]
async fn main() {
    debug_page(login::login_router()).await;
}
*/