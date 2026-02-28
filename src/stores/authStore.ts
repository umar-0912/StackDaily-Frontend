import { create } from 'zustand';
import { tokenStorage } from '../utils/token';
import { authApi } from '../api/auth';
import { usersApi } from '../api/users';
import type { User, SignupRequest } from '../types';
import { AxiosError } from 'axios';

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
  login: (email: string, password: string) => Promise<void>;
  signup: (data: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  restoreSession: () => Promise<void>;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: User) => void;
  resetAuth: () => void;
  clearError: () => void;
}

const getErrorMessage = (error: unknown): string => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as ApiErrorResponse | undefined;
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

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isRestoring: true,
  isSubmitting: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data } = await authApi.login({ email, password });
      await tokenStorage.setTokens(data.accessToken, data.refreshToken);
      set({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken: data.refreshToken,
        isAuthenticated: true,
        isSubmitting: false,
        error: null,
      });
    } catch (error) {
      set({
        isSubmitting: false,
        error: getErrorMessage(error),
      });
      throw error;
    }
  },

  signup: async (data: SignupRequest) => {
    set({ isSubmitting: true, error: null });
    try {
      const { data: responseData } = await authApi.signup(data);
      await tokenStorage.setTokens(
        responseData.accessToken,
        responseData.refreshToken,
      );
      set({
        user: responseData.user,
        accessToken: responseData.accessToken,
        refreshToken: responseData.refreshToken,
        isAuthenticated: true,
        isSubmitting: false,
        error: null,
      });
    } catch (error) {
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

      // Try to fetch the user profile with the stored token
      const { data: user } = await usersApi.getProfile();

      set({
        user,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isRestoring: false,
      });
    } catch {
      // Token may be expired or invalid
      await tokenStorage.clearTokens();
      set({
        user: null,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isRestoring: false,
      });
    }
  },

  setTokens: (accessToken: string, refreshToken: string) => {
    set({ accessToken, refreshToken });
  },

  setUser: (user: User) => {
    set({ user });
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
    });
  },

  clearError: () => {
    set({ error: null });
  },
}));
