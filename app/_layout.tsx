import { useEffect, useRef } from 'react';
import { AppState } from 'react-native';
import { Slot, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider, focusManager, type DefaultOptions } from '@tanstack/react-query';
import type { AxiosError } from 'axios';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Subscription } from 'expo-notifications';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { StripeProvider } from '@stripe/stripe-react-native';
import { useAuthStore } from '../src/stores/authStore';
import {
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../src/utils/notifications';
import { GOOGLE_WEB_CLIENT_ID, STRIPE_PUBLISHABLE_KEY } from '../src/utils/constants';

const isNetworkError = (error: unknown): boolean => {
  if (!error || typeof error !== 'object' || !('isAxiosError' in error)) return false;
  const axiosError = error as AxiosError;
  return !axiosError.response || axiosError.code === 'ECONNABORTED' || axiosError.code === 'ERR_NETWORK';
};

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        return isNetworkError(error);
      },
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: (failureCount, error) => {
        if (failureCount >= 2) return false;
        return isNetworkError(error);
      },
    },
  } satisfies DefaultOptions,
});

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#6200EE',
    primaryContainer: '#E8DEF8',
    secondary: '#03DAC6',
    secondaryContainer: '#CDF5ED',
    surface: '#FFFFFF',
    surfaceVariant: '#F5F5F5',
    background: '#FAFAFA',
    error: '#B00020',
    onPrimary: '#FFFFFF',
    onSecondary: '#000000',
    onSurface: '#1C1B1F',
    onBackground: '#1C1B1F',
    outline: '#79747E',
  },
};

export default function RootLayout() {
  const restoreSession = useAuthStore((state) => state.restoreSession);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const requiresVerification = useAuthStore((state) => state.requiresVerification);
  const router = useRouter();

  const notificationReceivedRef = useRef<Subscription | null>(null);
  const notificationResponseRef = useRef<Subscription | null>(null);

  // React Query auto-refetch when app comes to foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (status) => {
      focusManager.setFocused(status === 'active');
    });
    return () => sub.remove();
  }, []);

  // Configure Google Sign-In
  useEffect(() => {
    if (GOOGLE_WEB_CLIENT_ID) {
      GoogleSignin.configure({
        webClientId: GOOGLE_WEB_CLIENT_ID,
        offlineAccess: false,
      });
    }
  }, []);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Track whether initial routing has been handled by index.tsx
  const hasInitialized = useRef(false);

  // Auth state listener: redirect on reactive auth changes (logout, token expiry)
  // Skips first run to let index.tsx handle initial routing (prevents race with onboarding check)
  useEffect(() => {
    if (isRestoring) return;

    if (!hasInitialized.current) {
      hasInitialized.current = true;
      return; // Let index.tsx handle first routing decision
    }

    // Handle reactive auth changes (mid-session logout, verification needed)
    if (requiresVerification) {
      router.replace('/(auth)/verify-email');
    } else if (!isAuthenticated) {
      queryClient.clear();
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isRestoring, requiresVerification]);

  // Set up notification listeners
  useEffect(() => {
    notificationReceivedRef.current = addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification.request.content.title);
      },
    );

    notificationResponseRef.current = addNotificationResponseListener(
      (response) => {
        // Navigate to feed when user taps a notification
        const data = response.notification.request.content.data as
          | { dailySelectionId?: string }
          | undefined;

        if (data?.dailySelectionId) {
          router.push({
            pathname: '/(tabs)/question/[id]',
            params: { id: data.dailySelectionId },
          });
        } else {
          router.push('/(tabs)/feed');
        }
      },
    );

    return () => {
      if (notificationReceivedRef.current) {
        notificationReceivedRef.current.remove();
      }
      if (notificationResponseRef.current) {
        notificationResponseRef.current.remove();
      }
    };
  }, [router]);

  return (
    <QueryClientProvider client={queryClient}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.stackdaily.app"
      >
        <PaperProvider theme={theme}>
          <SafeAreaProvider>
            <StatusBar style="dark" />
            <Slot />
          </SafeAreaProvider>
        </PaperProvider>
      </StripeProvider>
    </QueryClientProvider>
  );
}
