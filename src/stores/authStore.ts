import { create } from 'zustand';
import { tokenStorage } from '../utils/token';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import type { User, SignupRequest } from '../types';
import { AxiosError } from 'axios';
import {
  GoogleSignin,
  isSuccessResponse,
  statusCodes,
} from '@react-native-google-signin/google-signin';

interface ApiErrorResponse {
  message: string;
  statusCode?: number;
}

interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isRestoring: boolean;
  isSubmitting: boolean;
  error: string | null;
  requiresVerification: boolean;
  pendingVerificationEmail: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  googleSignIn: () => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  setVerified: () => void;
  resetAuth: () => void;
  clearError: () => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    // Network-level failures (no response from server)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return 'Connection timed out. Please check your internet and try again.';
      }
      if (error.code === 'ERR_NETWORK') {
        return 'Unable to connect to the server. Please check your internet connection and try again.';
      }
      return 'Unable to reach the server. Please try again.';
    }
    // Server responded with an error
    const data = error.response.data as ApiErrorResponse | undefined;
    if (data?.message) {
      return data.message;
    }
    if (error.message) {
      return error.message;
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
};

/**
 * Retries a network request with exponential backoff.
 * Only retries on network errors and timeouts, NOT on server errors (4xx/5xx).
 */
const retryableRequest = async <T>(
  fn: () => Promise<T>,
  maxRetries = 3,
): Promise<T> => {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      const isRetryable =
        error instanceof AxiosError &&
        (!error.response ||
          error.code === 'ECONNABORTED' ||
          error.code === 'ERR_NETWORK');
      if (!isRetryable || attempt === maxRetries - 1) throw error;
      await new Promise((r) => setTimeout(r, 1000 * Math.pow(2, attempt)));
    }
  }
  throw new Error('Max retries exceeded');
};

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isRestoring: true,
  isSubmitting: false,
  error: null,
  requiresVerification: false,
  pendingVerificationEmail: null,

  login: async (email: string, password: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await retryableRequest(() =>
        authApi.login({ email, password }),
      );
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);

      if (!data.user.isEmailVerified) {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: false,
          requiresVerification: true,
          pendingVerificationEmail: data.user.email,
          isSubmitting: false,
          error: null,
        });
      } else {
        set({
          user: data.user,
          accessToken: data.accessToken,
          refreshToken: data.refreshToken,
          isAuthenticated: true,
          requiresVerification: false,
          pendingVerificationEmail: null,
          isSubmitting: false,
          error: null,
        });
      }
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  signup: async (signupData: SignupRequest) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data: responseData } = await retryableRequest(() =>
        authApi.signup(signupData),
      );
      await tokenStorage.setTokens(
        responseData.accessToken,
        responseData.refreshToken,
      );

      if (!responseData.user.isEmailVerified) {
        set({
          user: responseData.user,
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          isAuthenticated: false,
          requiresVerification: true,
          pendingVerificationEmail: responseData.user.email,
          isSubmitting: false,
          error: null,
        });
      } else {
        set({
          user: responseData.user,
          accessToken: responseData.accessToken,
          refreshToken: responseData.refreshToken,
          isAuthenticated: true,
          requiresVerification: false,
          pendingVerificationEmail: null,
          isSubmitting: false,
          error: null,
        });
      }
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  googleSignIn: async () => {
    set({ isSubmitting: true, error: null });
    try {
      await GoogleSignin.hasPlayServices();
      // Sign out first to force account picker (otherwise SDK auto-selects last account)
      await GoogleSignin.signOut();
      const response = await GoogleSignin.signIn();

      if (!isSuccessResponse(response)) {
        // User cancelled — silently return
        set({ isSubmitting: false });
        return;
      }

      const idToken = response.data.idToken;
      if (!idToken) {
        set({ isSubmitting: false, error: 'Failed to get Google ID token.' });
        return;
      }

      // Send ID token to backend for verification + login/signup
      const { data } = await retryableRequest(() =>
        authApi.googleSignIn({ idToken }),
      );
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);

      // Google users are always verified — go straight to authenticated
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        requiresVerification: false,
        pendingVerificationEmail: null,
        isSubmitting: false,
        error: null,
      });
    } catch (error: unknown) {
      // Handle Google Sign-In specific cancellation
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        (error as { code: string }).code === statusCodes.SIGN_IN_CANCELLED
      ) {
        set({ isSubmitting: false });
        return;
      }

      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  logout: async () => {
    await tokenStorage.clearTokens();
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isRestoring: false,
      isSubmitting: false,
      error: null,
      requiresVerification: false,
      pendingVerificationEmail: null,
    });
  },

  restoreSession: async () => {
    set({ isRestoring: true });
    try {
      const accessToken = await tokenStorage.getAccessToken();
      const refreshToken = await tokenStorage.getRefreshToken();

      if (!accessToken || !refreshToken) {
        set({ isRestoring: false, isAuthenticated: false });
        return;
      }

      // Try to fetch the user profile with the stored token.
      // Use only 2 attempts (not 3) to keep the splash screen snappy.
      const { data: user } = await retryableRequest(
        () => usersApi.getProfile(),
        2,
      );

      if (!user.isEmailVerified) {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: false,
          requiresVerification: true,
          pendingVerificationEmail: user.email,
          isRestoring: false,
        });
      } else {
        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          requiresVerification: false,
          pendingVerificationEmail: null,
          isRestoring: false,
        });
      }
    } catch {
      // Token may be expired or invalid
      await tokenStorage.clearTokens();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isRestoring: false,
        requiresVerification: false,
        pendingVerificationEmail: null,
      });
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken });
  },

  setUser: (user: User) => {
    set({ user });
  },

  setVerified: () => {
    set({
      requiresVerification: false,
      pendingVerificationEmail: null,
      isAuthenticated: true,
    });
  },

  resetAuth: () => {
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isRestoring: false,
      isSubmitting: false,
      error: null,
      requiresVerification: false,
      pendingVerificationEmail: null,
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
