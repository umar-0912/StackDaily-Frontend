import * as SecureStore from 'expo-secure-store';

const ACCESS_TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

// In-memory cache to avoid repeated Secure Store I/O (slow on Android Keystore,
// especially on first launch when Keystore is initializing)
let cachedAccessToken: string | null | undefined = undefined;
let cachedRefreshToken: string | null | undefined = undefined;

export const tokenStorage = {
  async getAccessToken(): Promise<string | null> {
    if (cachedAccessToken !== undefined) return cachedAccessToken;
    cachedAccessToken = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
    return cachedAccessToken;
  },

  async getRefreshToken(): Promise<string | null> {
    if (cachedRefreshToken !== undefined) return cachedRefreshToken;
    cachedRefreshToken = await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
    return cachedRefreshToken;
  },

  async setTokens(accessToken: string, refreshToken: string): Promise<void> {
    cachedAccessToken = accessToken;
    cachedRefreshToken = refreshToken;
    await Promise.all([
      SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken),
      SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken),
    ]);
  },

  async clearTokens(): Promise<void> {
    cachedAccessToken = null;
    cachedRefreshToken = null;
    await Promise.all([
      SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
    ]);
  },
};
