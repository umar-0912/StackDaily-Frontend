import { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ScrollView,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Searchbar,
  ProgressBar,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTopics } from '../../src/hooks/useTopics';
import { useUpdateSubscriptions } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useAuthStore } from '../../src/stores/authStore';
import { LoadingScreen, ErrorScreen, EmptyState } from '../../src/components';
import { getTopicIcon } from '../../src/utils/icons';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '../../src/utils/constants';
import type { Topic, TopicProgress } from '../../src/types';

const ALL_CATEGORY = 'All';

const ItemSeparator = () => <View style={styles.separator} />;

export default function TopicsScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(ALL_CATEGORY);
  const [togglingTopicId, setTogglingTopicId] = useState<string | null>(null);

  const { data: topicsData, isLoading, isError, refetch, isRefetching } = useTopics({
    limit: 100,
    isActive: 'true',
  });
  const updateSubscriptionsMutation = useUpdateSubscriptions();
  const { data: progressData } = useProgress();
  const user = useAuthStore((state) => state.user);

  const subscribedIds = useMemo(() => {
    return new Set(user?.subscribedTopics.map((t) => t._id) ?? []);
  }, [user?.subscribedTopics]);

  const progressByTopicId = useMemo(() => {
    const map = new Map<string, TopicProgress>();
    if (progressData) {
      for (const p of progressData) {
        map.set(p.topic._id, p);
      }
    }
    return map;
  }, [progressData]);

  const categories = useMemo(() => {
    if (!topicsData?.data) return [ALL_CATEGORY];
    const uniqueCategories = [
      ...new Set(topicsData.data.map((t) => t.category)),
    ].sort();
    return [ALL_CATEGORY, ...uniqueCategories];
  }, [topicsData?.data]);

  const filteredTopics = useMemo(() => {
    if (!topicsData?.data) return [];
    let result = topicsData.data;

    if (selectedCategory !== ALL_CATEGORY) {
      result = result.filter((t) => t.category === selectedCategory);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      result = result.filter((t) =>
        t.name.toLowerCase().includes(query),
      );
    }

    return result;
  }, [topicsData?.data, selectedCategory, searchQuery]);

  const handleToggleSubscription = useCallback(
    async (topicId: string) => {
      setTogglingTopicId(topicId);
      try {
        const currentIds = user?.subscribedTopics.map((t) => t._id) ?? [];
        let newIds: string[];

        if (currentIds.includes(topicId)) {
          newIds = currentIds.filter((id) => id !== topicId);
        } else {
          newIds = [...currentIds, topicId];
        }

        await updateSubscriptionsMutation.mutateAsync({ topicIds: newIds });
      } finally {
        setTogglingTopicId(null);
      }
    },
    [user?.subscribedTopics, updateSubscriptionsMutation],
  );

  const renderCategoryChip = useCallback(
    (category: string) => {
      const isSelected = category === selectedCategory;
      return (
        <Chip
          key={category}
          mode={isSelected ? 'flat' : 'outlined'}
          selected={isSelected}
          onPress={() => setSelectedCategory(category)}
          style={[
            styles.categoryChip,
            isSelected && { backgroundColor: theme.colors.primaryContainer },
          ]}
          selectedColor={theme.colors.primary}
        >
          {category}
        </Chip>
      );
    },
    [selectedCategory, theme.colors.primary, theme.colors.primaryContainer],
  );

  const renderTopicCard = useCallback(
    ({ item }: { item: Topic }) => {
      const isSubscribed = subscribedIds.has(item._id);
      const iconName = getTopicIcon(item.icon);
      const isToggling = togglingTopicId === item._id;
      const progress = progressByTopicId.get(item._id);

      return (
        <Card style={[styles.topicCard, { backgroundColor: theme.colors.surface }]} mode="elevated">
          <Card.Content>
            <View style={styles.topicHeader}>
              <View style={styles.topicIconRow}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={28}
                  color={theme.colors.primary}
                />
                <View style={styles.topicInfo}>
                  <Text variant="titleMedium" style={styles.topicName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Chip
                    compact
                    style={[styles.categoryBadge, { backgroundColor: theme.colors.primaryContainer }]}
                    textStyle={[styles.categoryBadgeText, { color: theme.colors.primary }]}
                  >
                    {item.category}
                  </Chip>
                </View>
              </View>
            </View>

            <Text
              variant="bodyMedium"
              style={[styles.topicDescription, { color: theme.colors.onSurfaceVariant }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>

            {isSubscribed && progress ? (
              <View style={styles.topicProgressSection}>
                <View style={styles.topicProgressLabelRow}>
                  <Chip
                    compact
                    style={[
                      styles.statusChip,
                      {
                        backgroundColor:
                          progress.status === 'completed'
                            ? '#4CAF5020'
                            : progress.status === 'in_progress'
                              ? '#2196F320'
                              : '#9E9E9E20',
                      },
                    ]}
                    textStyle={{
                      fontSize: 10,
                      color:
                        progress.status === 'completed'
                          ? '#4CAF50'
                          : progress.status === 'in_progress'
                            ? '#2196F3'
                            : '#9E9E9E',
                    }}
                  >
                    {progress.status === 'completed'
                      ? 'Completed'
                      : progress.status === 'in_progress'
                        ? 'In Progress'
                        : 'Not Started'}
                  </Chip>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {progress.questionsAnswered}/{progress.totalQuestions}
                  </Text>
                </View>
                <ProgressBar
                  progress={progress.percentComplete / 100}
                  color={
                    progress.status === 'completed'
                      ? '#4CAF50'
                      : theme.colors.primary
                  }
                  style={styles.topicProgressBar}
                />
                {progress.currentDifficulty ? (
                  <Text
                    variant="labelSmall"
                    style={{
                      color: DIFFICULTY_COLORS[progress.currentDifficulty as keyof typeof DIFFICULTY_COLORS] ?? theme.colors.onSurfaceVariant,
                      marginTop: 4,
                    }}
                  >
                    Level: {DIFFICULTY_LABELS[progress.currentDifficulty as keyof typeof DIFFICULTY_LABELS] ?? progress.currentDifficulty}
                  </Text>
                ) : null}
              </View>
            ) : null}
          </Card.Content>

          <Card.Actions style={styles.topicActions}>
            <Button
              mode={isSubscribed ? 'contained' : 'outlined'}
              onPress={() => handleToggleSubscription(item._id)}
              loading={isToggling}
              disabled={isToggling}
              icon={isSubscribed ? 'check' : 'plus'}
              compact
              style={isSubscribed ? styles.subscribedButton : styles.subscribeButton}
              textColor={isSubscribed ? theme.colors.onPrimary : theme.colors.primary}
              buttonColor={isSubscribed ? theme.colors.primary : undefined}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </Card.Actions>
        </Card>
      );
    },
    [
      subscribedIds,
      progressByTopicId,
      theme.colors.primary,
      theme.colors.onPrimary,
      theme.colors.surface,
      theme.colors.primaryContainer,
      theme.colors.onSurfaceVariant,
      handleToggleSubscription,
      togglingTopicId,
    ],
  );

  const keyExtractor = useCallback((item: Topic) => item._id, []);

  if (isLoading) {
    return <LoadingScreen message="Loading topics..." />;
  }

  if (isError) {
    return (
      <ErrorScreen
        message="We couldn't load the topics. Please try again."
        onRetry={refetch}
      />
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.surfaceVariant }]} edges={['bottom']}>
      <View style={[styles.filtersContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map(renderCategoryChip)}
        </ScrollView>

        <Searchbar
          placeholder="Search topics..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={styles.searchInput}
          elevation={0}
        />
      </View>

      <FlatList
        data={filteredTopics}
        renderItem={renderTopicCard}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <EmptyState
            icon="book-search-outline"
            title="No topics found"
            subtitle={
              searchQuery
                ? 'Try a different search term'
                : 'No topics available at the moment'
            }
          />
        }
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={ItemSeparator}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filtersContainer: {
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  categoriesContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
  },
  categoryChip: {
    marginRight: 0,
  },
  searchBar: {
    marginHorizontal: 16,
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 44,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
    flexGrow: 1,
  },
  topicCard: {
    borderRadius: 12,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  topicIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  topicInfo: {
    flex: 1,
    gap: 4,
  },
  topicName: {
    fontWeight: '600',
  },
  categoryBadge: {
    alignSelf: 'flex-start',
  },
  categoryBadgeText: {
    fontSize: 11,
    lineHeight: 16,
  },
  topicDescription: {
    lineHeight: 20,
  },
  topicProgressSection: {
    marginTop: 12,
  },
  topicProgressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusChip: {
    height: 26,
  },
  topicProgressBar: {
    height: 4,
    borderRadius: 2,
  },
  topicActions: {
    justifyContent: 'flex-end',
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  subscribedButton: {
    borderRadius: 20,
  },
  subscribeButton: {
    borderRadius: 20,
  },
  separator: {
    height: 12,
  },
});
