import { apiClient } from './client';
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  TokenRefreshResponse,
} from '../types';

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data),

  signup: (data: SignupRequest) =>
    apiClient.post<AuthResponse>('/auth/signup', data),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenRefreshResponse>(
      '/auth/refresh',
      {},
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
      },
    ),
};
