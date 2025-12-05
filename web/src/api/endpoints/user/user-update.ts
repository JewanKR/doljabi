/**
 * 유저 정보 업데이트 API
 */

import { customInstance } from '../../axios-instance';

export interface UpdateUsernameRequest {
  session_key: string;
  new_username: string;
}

export interface UpdatePasswordRequest {
  session_key: string;
  current_password: string;
  new_password: string;
}

export interface ApiResponse {
  success: boolean;
  message: string;
}

/**
 * 닉네임 변경
 */
export const updateUsername = async (data: UpdateUsernameRequest): Promise<ApiResponse> => {
  const response = await customInstance<ApiResponse>({
    url: '/api/user/update-username',
    method: 'POST',
    data,
  });
  return response;
};

/**
 * 비밀번호 변경
 */
export const updatePassword = async (data: UpdatePasswordRequest): Promise<ApiResponse> => {
  const response = await customInstance<ApiResponse>({
    url: '/api/user/update-password',
    method: 'POST',
    data,
  });
  return response;
};

