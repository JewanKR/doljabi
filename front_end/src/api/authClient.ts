// src/api/authClient.ts
import type { components } from "../api/schema";

// openapi에서 자동으로 뽑은 타입
export type LoginPayload = components["schemas"]["LoginForm"];
export type SignupPayload = components["schemas"]["SignupForm"];

const BASE_URL = "http://localhost:3000/api";

export type ApiResult<T = unknown> = {
  status: number;   // 200 / 400 / 500
  data: T | null;   // 서버가 준 JSON 전체
  message: string;  // 화면에 띄울 메시지
};

// 공통 POST JSON 호출 함수
async function postJson<TBody, TRes = any>(
  path: string,
  body: TBody,
  messages: Record<number, string>
): Promise<ApiResult<TRes>> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body)   // 여기에서 JSON으로 변환해서 서버로 전송
  });

  let data: any = null;
  try {
    data = await res.json();
  } catch {
    // 응답 바디가 비어 있을 수도 있으니 무시
  }

  const defaultMessage = messages[res.status] ?? "";
  const serverMessage =
    typeof data?.message === "string" ? data.message : "";
  const message = serverMessage || defaultMessage;

  return {
    status: res.status,
    data,
    message
  };
}

// 로그인 API: {login_id, password} → 서버로 JSON 전송
export function login(payload: LoginPayload) {
  const messages: Record<number, string> = {
    200: "로그인에 성공했습니다.",
    400: "아이디 또는 비밀번호를 다시 확인해주세요.",
    500: "로그인 처리 중 서버 오류가 발생했습니다."
  };

  return postJson<LoginPayload>("/login", payload, messages);
}

// 회원가입 API: {login_id, password, email} → 서버로 JSON 전송
export function signup(payload: SignupPayload) {
  const messages: Record<number, string> = {
    200: "회원가입이 완료되었습니다.",
    400: "입력 정보를 다시 확인해주세요.",
    500: "회원가입 처리 중 서버 오류가 발생했습니다."
  };

  return postJson<SignupPayload>("/signup", payload, messages);
}