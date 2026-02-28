import { View, StyleSheet } from 'react-native';
import { Text, Button, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface ErrorScreenProps {
  message?: string;
  onRetry: () => void;
}

export function ErrorScreen({
  message = 'Something went wrong. Please try again.',
  onRetry,
}: ErrorScreenProps) {
  const theme = useTheme();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <MaterialCommunityIcons
          name="alert-circle-outline"
          size={64}
          color={theme.colors.error}
        />
        <Text variant="titleMedium" style={styles.title}>
          Oops!
        </Text>
        <Text
          variant="bodyMedium"
          style={[styles.message, { color: theme.colors.outline }]}
        >
          {message}
        </Text>
        <Button
          mode="contained"
          onPress={onRetry}
          style={styles.retryButton}
          icon="refresh"
        >
          Retry
        </Button>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  title: {
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  message: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    marginTop: 24,
  },
});
