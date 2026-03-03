import { useEffect, useRef } from 'react';
import { Slot, useRouter } from 'expo-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { PaperProvider, MD3LightTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import type { Subscription } from 'expo-notifications';
import { useAuthStore } from '../src/stores/authStore';
import {
  registerForPushNotifications,
  registerTokenWithBackend,
  addNotificationReceivedListener,
  addNotificationResponseListener,
} from '../src/utils/notifications';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
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
  const router = useRouter();

  const notificationReceivedRef = useRef<Subscription | null>(null);
  const notificationResponseRef = useRef<Subscription | null>(null);

  useEffect(() => {
    restoreSession();
  }, [restoreSession]);

  // Auth state listener: redirect to login on logout, clear stale query data
  useEffect(() => {
    if (isRestoring) return;
    if (!isAuthenticated) {
      queryClient.clear();
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isRestoring]);

  // Register for push notifications after authentication
  useEffect(() => {
    if (!isAuthenticated || isRestoring) return;

    const setupPushNotifications = async () => {
      const token = await registerForPushNotifications();
      if (token) {
        await registerTokenWithBackend(token);
      }
    };

    setupPushNotifications();
  }, [isAuthenticated, isRestoring]);

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
      <PaperProvider theme={theme}>
        <SafeAreaProvider>
          <StatusBar style="dark" />
          <Slot />
        </SafeAreaProvider>
      </PaperProvider>
    </QueryClientProvider>
  );
}
