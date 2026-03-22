import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usersApi } from '../api/users';

const NOTIFICATION_PROMPT_KEY = 'hasSeenNotificationPrompt';

// Configure notification handler (how notifications appear when app is in foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function registerForPushNotifications(): Promise<string | null> {
  try {
    if (!Device.isDevice) {
      console.warn('Push notifications require a physical device');
      return null;
    }

    // Check existing permissions
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    // Request permissions if not granted
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.warn('Push notification permission not granted');
      return null;
    }

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Default',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF6B35',
      });
    }

    // Get the native FCM device token (required by Firebase Admin SDK on backend)
    const tokenData = await Notifications.getDevicePushTokenAsync();

    return tokenData.data as string;
  } catch (error) {
    console.warn('Push notification setup failed (this is OK during local dev):', error);
    return null;
  }
}

export async function registerTokenWithBackend(token: string): Promise<void> {
  try {
    await usersApi.updateFcmToken({ fcmToken: token });
  } catch (error) {
    console.error('Failed to register push token with backend:', error);
  }
}

// Notification event listeners
export function addNotificationReceivedListener(
  callback: (notification: Notifications.Notification) => void,
) {
  return Notifications.addNotificationReceivedListener(callback);
}

export function addNotificationResponseListener(
  callback: (response: Notifications.NotificationResponse) => void,
) {
  return Notifications.addNotificationResponseReceivedListener(callback);
}

// Notification prompt tracking (post-login modal)
export async function hasSeenNotificationPrompt(): Promise<boolean> {
  try {
    const value = await AsyncStorage.getItem(NOTIFICATION_PROMPT_KEY);
    return value === 'true';
  } catch {
    return false;
  }
}

export async function markNotificationPromptSeen(): Promise<void> {
  try {
    await AsyncStorage.setItem(NOTIFICATION_PROMPT_KEY, 'true');
  } catch {
    console.warn('Failed to persist notification prompt state');
  }
}

export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  } catch {
    return false;
  }
}
