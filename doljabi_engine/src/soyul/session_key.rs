//세션 키 생성 유틸
//4096 비트 OS RNG + Base64 인코딩
use argon2::password_hash::rand_core::{OsRng, RngCore};
use base64::{engine::general_purpose, Engine as _};

//4096비트의 랜덤 세션키를 생성해서 URL-safe Base64 문자열로 반환
pub fn generate_session_key() -> String {
    let mut bytes = [0u8; 512]; //512 바이트 = 4096 비트
    OsRng.fill_bytes(&mut bytes); // 난수생성기
    general_purpose::URL_SAFE_NO_PAD.encode(&bytes) // URL-safe Base64 문자열로 인코딩
}