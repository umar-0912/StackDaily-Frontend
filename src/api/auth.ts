import { apiClient } from './client';
import type {
  AuthResponse,
  LoginRequest,
  SignupRequest,
  TokenRefreshResponse,
  VerifyEmailRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ResendOtpRequest,
  GoogleSignInRequest,
  MessageResponse,
} from '../types';

// Auth endpoints use a longer timeout (30s) since they involve
// first-ever HTTPS connections (cold DNS + full TLS handshake)
const AUTH_TIMEOUT = 30000;

export const authApi = {
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>('/auth/login', data, { timeout: AUTH_TIMEOUT }),

  signup: (data: SignupRequest) =>
    apiClient.post<AuthResponse>('/auth/signup', data, { timeout: AUTH_TIMEOUT }),

  refresh: (refreshToken: string) =>
    apiClient.post<TokenRefreshResponse>(
      '/auth/refresh',
      {},
      {
        headers: { Authorization: `Bearer ${refreshToken}` },
        timeout: AUTH_TIMEOUT,
      },
    ),

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<MessageResponse>('/auth/verify-email', data, { timeout: AUTH_TIMEOUT }),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/forgot-password', data, { timeout: AUTH_TIMEOUT }),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/reset-password', data, { timeout: AUTH_TIMEOUT }),

  resendOtp: (data: ResendOtpRequest) =>
    apiClient.post<MessageResponse>('/auth/resend-otp', data, { timeout: AUTH_TIMEOUT }),

  googleSignIn: (data: GoogleSignInRequest) =>
    apiClient.post<AuthResponse>('/auth/google', data, { timeout: AUTH_TIMEOUT }),
};
