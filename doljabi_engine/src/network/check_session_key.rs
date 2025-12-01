use axum::{extract::FromRequestParts, http::{StatusCode, request::Parts}, response::{IntoResponse, Response}};

pub struct SessionKey(pub String);

impl <S> FromRequestParts <S> for SessionKey 
where 
    S: Send + Sync,
{
    type Rejection = SessionKeyError;

    // http 요청에서 세션키 추출
    async fn from_request_parts(
            parts: &mut Parts,
            _state: &S,
        ) -> Result<Self, Self::Rejection> {
        let session_key = parts
            .headers
            .get("x-session-key")
            .ok_or(SessionKeyError::Missing)?
            .to_str()
            .map_err(|_| SessionKeyError::Invalid)?
            .to_string();

        Ok(SessionKey(session_key))
    }
}

// 없을 때 에러 정의
pub enum SessionKeyError {
    Missing,
    Invalid,
}

impl IntoResponse for SessionKeyError {
    fn into_response(self) -> Response {
        let (status, message) = match self {
            Self::Missing => (StatusCode::BAD_REQUEST, "Missing X-Session-Key header"),
            Self::Invalid => (StatusCode::BAD_REQUEST, "Invalid X-Session-Key header"),
        };
        (status, message).into_response()
    }
}
