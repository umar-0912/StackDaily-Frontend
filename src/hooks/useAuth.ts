import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  // Zustand store actions are stable references — no useCallback wrappers needed
  return useAuthStore((state) => ({
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isRestoring: state.isRestoring,
    isSubmitting: state.isSubmitting,
    error: state.error,
    login: state.login,
    signup: state.signup,
    googleSignIn: state.googleSignIn,
    logout: state.logout,
    restoreSession: state.restoreSession,
    clearError: state.clearError,
  }));
}
