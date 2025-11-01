use axum::{Json, response::{Html, IntoResponse}};
use hyper::StatusCode;
use utoipa_axum::{router::OpenApiRouter, routes};
use std::fs;

/// OpenAPI JSON 스펙을 반환하는 엔드포인트
#[utoipa::path(
    get,    
    path = "/api/admin/openapi/openapi.json",
    responses(
        (status = 200, description = "OpenAPI 스펙 반환 성공"),
        (status = 500, description = "서버 오류"),
    )
)]
async fn get_openapi_spec() -> impl IntoResponse {
    match fs::read_to_string("./src/openapi.json") {
        Ok(json_content) => {
            match serde_json::from_str::<serde_json::Value>(&json_content) {
                Ok(json_value) => (StatusCode::OK, Json(json_value)).into_response(),
                Err(e) => (
                    StatusCode::INTERNAL_SERVER_ERROR,
                    format!("Failed to parse OpenAPI JSON: {}", e)
                ).into_response(),
            }
        }
        Err(e) => (
            StatusCode::INTERNAL_SERVER_ERROR,
            format!("Failed to read OpenAPI file: {}", e)
        ).into_response(),
    }
}

// Swagger UI HTML 페이지
#[utoipa::path(
    get,
    path = "/api/admin/openapi",
    responses(
        (status = 200, description = "Swagger UI 페이지"),
    )
)]
async fn swagger_ui_page() -> Html<String> {
    let html = r#"
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Doljabi API Documentation</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body { margin: 0; padding: 0; }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        window.onload = function() {
            SwaggerUIBundle({
                url: "/api/admin/openapi/openapi.json",
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "StandaloneLayout"
            });
        };
    </script>
</body>
</html>
    "#;
    Html(html.to_string())
}


/// Admin 페이지 라우터
pub fn admin_page_router() -> OpenApiRouter {
    OpenApiRouter::new()
        .routes(routes!(get_openapi_spec))
        .routes(routes!(swagger_ui_page))
}