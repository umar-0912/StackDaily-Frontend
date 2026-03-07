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
    googleSignIn,
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

  const handleGoogleSignIn = useCallback(async () => {
    await googleSignIn();
  }, [googleSignIn]);

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
    googleSignIn: handleGoogleSignIn,
    logout: handleLogout,
    restoreSession: handleRestoreSession,
    clearError,
  };
}
