import { useCallback } from 'react';
import { useAuthStore } from '../stores/authStore';
import type { SignupRequest } from '../types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isRestoring,
    isSubmitting,
    error,
    login,
    signup,
    logout,
    restoreSession,
    clearError,
  } = useAuthStore();

  const handleLogin = useCallback(
    async (email: string, password: string) => {
      await login(email, password);
    },
    [login],
  );

  const handleSignup = useCallback(
    async (data: SignupRequest) => {
      await signup(data);
    },
    [signup],
  );

  const handleLogout = useCallback(async () => {
    await logout();
  }, [logout]);

  const handleRestoreSession = useCallback(async () => {
    await restoreSession();
  }, [restoreSession]);

  return {
    user,
    isAuthenticated,
    isRestoring,
    isSubmitting,
    error,
    login: handleLogin,
    signup: handleSignup,
    logout: handleLogout,
    restoreSession: handleRestoreSession,
    clearError,
  };
}
