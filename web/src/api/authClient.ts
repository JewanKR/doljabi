// src/api/authClient.ts
import type { components } from "../api/schema";

// openapi에서 자동으로 뽑은 타입
export type LoginPayload = components["schemas"]["LoginForm"];
export type SignupPayload = components["schemas"]["SignupForm"];
export type CreateRoomPayload = components["schemas"]["CreateRoomRequestForm"];
export type CreateRoomResponse = components["schemas"]["CreateRoomResponseForm"];

// 로그인 응답 타입
export type LoginResponse = {
  success: boolean;
  message: string;
  session_key: string | null;
};

const BASE_URL = "http://localhost:3000/api";
const SESSION_KEY_STORAGE = "doljabi_session_key";

export type ApiResult<T = unknown> = {
  status: number;   // 200 / 400 / 500
  data: T | null;   // 서버가 준 JSON 전체
  message: string;  // 화면에 띄울 메시지
};

// 세션 키 관리 함수들
export function setSessionKey(sessionKey: string): void {
  localStorage.setItem(SESSION_KEY_STORAGE, sessionKey);
}

export function getSessionKey(): string | null {
  return localStorage.getItem(SESSION_KEY_STORAGE);
}

export function clearSessionKey(): void {
  localStorage.removeItem(SESSION_KEY_STORAGE);
}

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
export async function login(payload: LoginPayload): Promise<ApiResult<LoginResponse>> {
  const messages: Record<number, string> = {
    200: "로그인에 성공했습니다.",
    400: "아이디 또는 비밀번호를 다시 확인해주세요.",
    500: "로그인 처리 중 서버 오류가 발생했습니다."
  };

  const result = await postJson<LoginPayload, LoginResponse>("/login", payload, messages);
  
  // 로그인 성공 시 session_key를 localStorage에 저장
  if (result.status === 200 && result.data?.session_key) {
    setSessionKey(result.data.session_key);
  } else {
    // 로그인 실패 시 세션 키 삭제
    clearSessionKey();
  }
  
  return result;
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

// 방 생성 API
export function createRoom(payload: CreateRoomPayload) {
  const messages: Record<number, string> = {
    201: "방이 성공적으로 생성되었습니다.",
    400: "방 생성에 실패했습니다. 입력 정보를 확인해주세요.",
    500: "방 생성 중 서버 오류가 발생했습니다."
  };

  return postJson<CreateRoomPayload, CreateRoomResponse>("/room/create", payload, messages);
}