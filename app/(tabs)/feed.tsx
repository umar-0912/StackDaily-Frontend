import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  ActivityIndicator,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFeed, useMarkRead } from '../../src/hooks/useFeed';
import { useAuthStore } from '../../src/stores/authStore';
import { StreakBadge, QuestionCard } from '../../src/components';
import type { DailyFeedItem } from '../../src/types';

const ItemSeparator = () => <View style={styles.separator} />;

function EmptyState() {
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const hasSubscriptions = (user?.subscribedTopics.length ?? 0) > 0;

  if (!hasSubscriptions) {
    return (
      <View style={styles.emptyContainer}>
        <MaterialCommunityIcons
          name="book-open-page-variant-outline"
          size={64}
          color="#6200EE"
        />
        <Text variant="titleMedium" style={styles.emptyTitle}>
          Subscribe to topics to start learning!
        </Text>
        <Text variant="bodyMedium" style={styles.emptySubtitle}>
          Pick topics that interest you and get daily questions.
        </Text>
        <Button
          mode="contained"
          onPress={() => router.push('/(tabs)/topics')}
          style={styles.browseButton}
          icon="book-open-variant"
        >
          Browse Topics
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="weather-sunny"
        size={64}
        color="#FFB74D"
      />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        No questions for today
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        Check back tomorrow for fresh learning content!
      </Text>
    </View>
  );
}

function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="alert-circle-outline"
        size={64}
        color="#B00020"
      />
      <Text variant="titleMedium" style={styles.emptyTitle}>
        Something went wrong
      </Text>
      <Text variant="bodyMedium" style={styles.emptySubtitle}>
        We couldn't load your daily feed. Please try again.
      </Text>
      <Button mode="contained" onPress={onRetry} style={styles.retryButton}>
        Retry
      </Button>
    </View>
  );
}

function FeedStreakHeader() {
  const user = useAuthStore((state) => state.user);
  const streakCount = user?.streak.count ?? 0;

  return (
    <View style={styles.streakHeaderWrapper}>
      <StreakBadge count={streakCount} size="small" />
    </View>
  );
}

export default function FeedScreen() {
  const router = useRouter();
  const { data: feedItems, isLoading, isError, refetch, isRefetching } = useFeed();
  const markReadMutation = useMarkRead();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handlePressItem = useCallback(
    (item: DailyFeedItem) => {
      router.push({
        pathname: '/(tabs)/question/[id]',
        params: { id: item.dailySelectionId, feedItem: JSON.stringify(item) },
      });
    },
    [router],
  );

  const handleMarkRead = useCallback(
    (dailySelectionId: string) => {
      markReadMutation.mutate(dailySelectionId, {
        onSuccess: () => {
          setSnackbarMessage('Marked as read! Streak updated.');
          setSnackbarVisible(true);
        },
        onError: () => {
          setSnackbarMessage('Failed to mark as read. Please try again.');
          setSnackbarVisible(true);
        },
      });
    },
    [markReadMutation],
  );

  const renderItem = useCallback(
    ({ item }: { item: DailyFeedItem }) => (
      <QuestionCard
        item={item}
        onPress={() => handlePressItem(item)}
        onMarkRead={() => handleMarkRead(item.dailySelectionId)}
        isMarkingRead={
          markReadMutation.isPending &&
          markReadMutation.variables === item.dailySelectionId
        }
      />
    ),
    [handlePressItem, handleMarkRead, markReadMutation.isPending, markReadMutation.variables],
  );

  const keyExtractor = useCallback(
    (item: DailyFeedItem) => item.dailySelectionId,
    [],
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text variant="bodyLarge" style={styles.loadingText}>
            Loading your daily feed...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (isError) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ErrorState onRetry={refetch} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={feedItems}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={<FeedStreakHeader />}
        ListEmptyComponent={<EmptyState />}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={['#6200EE']}
            tintColor="#6200EE"
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={3000}
        action={{
          label: 'OK',
          onPress: () => setSnackbarVisible(false),
        }}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    color: '#666',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  streakHeaderWrapper: {
    marginBottom: 16,
  },
  separator: {
    height: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyTitle: {
    fontWeight: '600',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtitle: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  browseButton: {
    marginTop: 24,
  },
  retryButton: {
    marginTop: 24,
  },
});
