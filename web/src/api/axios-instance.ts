import axios, { AxiosError } from "axios";
import type { InternalAxiosRequestConfig, AxiosRequestConfig } from "axios";

// 세션키를 저장하고 관리하는 클래스
class SessionManager {
  private static readonly SESSION_KEY = "doljabi_session_key";

  // 세션키 저장 (로그인 시 호출)
  static setSessionKey(sessionKey: string): void {
    localStorage.setItem(this.SESSION_KEY, sessionKey);
  }

  // 세션키 가져오기
  static getSessionKey(): string | null {
    return localStorage.getItem(this.SESSION_KEY);
  }

  // 세션키 삭제 (로그아웃 시 호출)
  static clearSessionKey(): void {
    localStorage.removeItem(this.SESSION_KEY);
  }

  // 세션키 존재 여부 확인
  static hasSessionKey(): boolean {
    return this.getSessionKey() !== null;
  }
}

// axios 인스턴스 생성
const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:27000",
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// 요청 인터셉터: 모든 요청에 세션키 추가
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const sessionKey = SessionManager.getSessionKey();

    // 세션키가 있으면 커스텀 헤더에 추가
    if (sessionKey) {
      config.headers.set("X-Session-Key", sessionKey);
    }

    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// 응답 인터셉터: 세션 만료 등 에러 처리
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error: AxiosError) => {
    // 401 Unauthorized: 세션 만료 또는 인증 실패
    if (error.response?.status === 401) {
      SessionManager.clearSessionKey();
      // 로그인 페이지로 리다이렉트 (필요시)
      // window.location.href = '/login';
    }

    return Promise.reject(error);
  }
);

export const customInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig
): Promise<T> => {
  const source = axios.CancelToken.source();

  const promise = axiosInstance({
    ...config,
    ...options,
    cancelToken: source.token,
  }).then(({ data }) => data);

  // @ts-ignore
  promise.cancel = () => {
    source.cancel('Query was cancelled');
  };

  return promise;
};

// SessionManager도 export하여 다른 곳에서 사용 가능하도록
export { SessionManager };
export default axiosInstance;