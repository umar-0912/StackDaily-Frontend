import { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { ActivityIndicator, Text } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { useAuthStore } from '../src/stores/authStore';

export default function Index() {
  const router = useRouter();
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const isRestoring = useAuthStore((state) => state.isRestoring);

  useEffect(() => {
    if (isRestoring) return;

    if (isAuthenticated) {
      router.replace('/(tabs)/feed');
    } else {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated, isRestoring, router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" />
      <Text style={styles.text} variant="bodyLarge">
        Micro Learner
      </Text>
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
  text: {
    marginTop: 8,
    color: '#6200EE',
    fontWeight: '600',
  },
});
