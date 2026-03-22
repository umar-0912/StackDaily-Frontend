import { useEffect, useState } from 'react';
import { View, StyleSheet, Image } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';
import { hasSeenOnboarding } from '../src/utils/onboarding';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);
  const requiresVerification = useAuthStore((state) => state.requiresVerification);
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingSeen, setOnboardingSeen] = useState(false);

  // Check onboarding flag on mount
  useEffect(() => {
    hasSeenOnboarding()
      .then((seen) => {
        setOnboardingSeen(seen);
        setIsCheckingOnboarding(false);
      })
      .catch(() => {
        // Default: show onboarding on error
        setOnboardingSeen(false);
        setIsCheckingOnboarding(false);
      });
  }, []);

  useEffect(() => {
    if (isRestoring || isCheckingOnboarding) return;

    // First-time user: show onboarding
    if (!onboardingSeen) {
      router.replace('/(onboarding)/welcome');
      return;
    }

    if (requiresVerification) {
      router.replace('/(auth)/verify-email');
    } else if (isAuthenticated) {
      router.replace('/(tabs)/feed');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isRestoring, requiresVerification, isCheckingOnboarding, onboardingSeen, router]);

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/icon.png')}
        style={styles.logo}
      />
      <Text style={styles.text} variant="bodyLarge">
        StackDaily
      </Text>
      <ActivityIndicator size="small" color="#6200EE" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    gap: 16,
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 20,
  },
  text: {
    marginTop: 12,
    color: '#6200EE',
    fontWeight: '700',
    fontSize: 24,
  },
});
