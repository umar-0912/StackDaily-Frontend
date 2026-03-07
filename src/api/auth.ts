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

  verifyEmail: (data: VerifyEmailRequest) =>
    apiClient.post<MessageResponse>('/auth/verify-email', data),

  forgotPassword: (data: ForgotPasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/forgot-password', data),

  resetPassword: (data: ResetPasswordRequest) =>
    apiClient.post<MessageResponse>('/auth/reset-password', data),

  resendOtp: (data: ResendOtpRequest) =>
    apiClient.post<MessageResponse>('/auth/resend-otp', data),

  googleSignIn: (data: GoogleSignInRequest) =>
    apiClient.post<AuthResponse>('/auth/google', data),
};
