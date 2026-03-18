import { useShallow } from 'zustand/react/shallow';
import { useAuthStore } from '../stores/authStore';

export function useAuth() {
  // useShallow prevents infinite re-renders from inline object selectors
  return useAuthStore(
    useShallow((state) => ({
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
    })),
  );
}
