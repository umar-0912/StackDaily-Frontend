import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { API_BASE_URL } from '../utils/constants';
import { tokenStorage } from '../utils/token';
import type { TokenRefreshResponse } from '../types';

interface FailedRequest {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}

let isRefreshing = false;
let failedQueue: FailedRequest[] = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (error) {
      promise.reject(error);
    } else if (token) {
      promise.resolve(token);
    }
  });
  failedQueue = [];
};

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Fire-and-forget warmup request to prime DNS cache, TCP connection pool,
// and TLS session on app start. This prevents first-launch failures on Android
// where the network stack is cold.
apiClient.get('/health', { timeout: 10000 }).catch(() => {});

// Request interceptor: attach access token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const accessToken = await tokenStorage.getAccessToken();
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: unwrap backend's { data, meta } envelope
apiClient.interceptors.response.use(
  (response) => {
    // Backend wraps all responses as { data: { ... }, meta: { ... } }
    // Unwrap so response.data gives the actual payload directly
    if (response.data && typeof response.data === 'object' && 'data' in response.data && 'meta' in response.data) {
      response.data = response.data.data;
    }
    return response;
  },
  (error) => Promise.reject(error),
);

// Response interceptor: handle 401 with token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 errors, and don't retry refresh requests themselves
    if (
      error.response?.status !== 401 ||
      originalRequest._retry ||
      originalRequest.url?.includes('/auth/refresh')
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while another refresh is in progress
      return new Promise<string>((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((token) => {
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${token}`;
        }
        return apiClient(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = await tokenStorage.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await axios.post(
        `${API_BASE_URL}/auth/refresh`,
        {},
        {
          headers: { Authorization: `Bearer ${refreshToken}` },
        },
      );

      // Unwrap backend's { data, meta } envelope
      const tokenData: TokenRefreshResponse =
        response.data?.data ?? response.data;

      await tokenStorage.setTokens(tokenData.accessToken, tokenData.refreshToken);

      processQueue(null, tokenData.accessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${tokenData.accessToken}`;
      }
      return apiClient(originalRequest);
    } catch (refreshError) {
      processQueue(refreshError, null);

      // Clear tokens and reset auth state
      await tokenStorage.clearTokens();

      // Lazy import to avoid circular dependency
      const { useAuthStore } = await import('../stores/authStore');
      useAuthStore.getState().resetAuth();

      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  },
);
