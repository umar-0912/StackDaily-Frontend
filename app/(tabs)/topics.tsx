import { useState, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Button,
  Searchbar,
  Portal,
  Dialog,
  Paragraph,
  List,
  Divider,
  useTheme,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTopics } from '../../src/hooks/useTopics';
import { useUpdateSubscriptions, useUnsubscribeTopic } from '../../src/hooks/useProfile';
import { useProgress } from '../../src/hooks/useProgress';
import { useAuthStore } from '../../src/stores/authStore';
import { useIsProUser } from '../../src/hooks/useIsProUser';
import { LoadingScreen, ErrorScreen, EmptyState } from '../../src/components';
import {
  CATEGORY_ICONS,
  MERGED_TECH_DISPLAY_NAME,
  getShortTopicName,
  getDisplayCategory,
  compareCategoryOrder,
  groupTechTopicsBySubcategory,
} from '../../src/utils/categoryConfig';
import type { Topic, TopicProgress } from '../../src/types';

interface UnsubscribeDialogState {
  visible: boolean;
  topicId: string;
  topicName: string;
  percentComplete: number;
}

const INITIAL_DIALOG_STATE: UnsubscribeDialogState = {
  visible: false,
  topicId: '',
  topicName: '',
  percentComplete: 0,
};

interface CategoryGroup {
  category: string;
  topics: Topic[];
  subscribedCount: number;
}

export default function TopicsScreen() {
  const theme = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [togglingTopicId, setTogglingTopicId] = useState<string | null>(null);
  const [unsubscribeDialog, setUnsubscribeDialog] = useState<UnsubscribeDialogState>(INITIAL_DIALOG_STATE);

  const { data: topicsData, isLoading, isError, refetch, isRefetching } = useTopics({
    limit: 100,
    isActive: 'true',
  });
  const updateSubscriptionsMutation = useUpdateSubscriptions();
  const unsubscribeTopicMutation = useUnsubscribeTopic();
  const { data: progressData } = useProgress();
  const user = useAuthStore((state) => state.user);
  const isProUser = useIsProUser();

  // ── Derived data ─────────────────────────────────────────────────────────

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

  const groupedTopics = useMemo((): CategoryGroup[] => {
    if (!topicsData?.data) return [];

    let topics = topicsData.data;

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();
      topics = topics.filter((t) => t.name.toLowerCase().includes(query));
    }

    // Group by display category (tech categories merge into one folder)
    const groups = new Map<string, Topic[]>();
    for (const topic of topics) {
      const displayCat = getDisplayCategory(topic.category);
      const existing = groups.get(displayCat) || [];
      existing.push(topic);
      groups.set(displayCat, existing);
    }

    // Sort categories by display order
    const sortedCategories = [...groups.keys()].sort(compareCategoryOrder);

    return sortedCategories.map((category) => {
      const categoryTopics = groups.get(category)!;
      return {
        category,
        topics: categoryTopics,
        subscribedCount: categoryTopics.filter((t) => subscribedIds.has(t._id)).length,
      };
    });
  }, [topicsData?.data, searchQuery, subscribedIds]);

  // Auto-expand all categories when searching
  const effectiveExpanded = useMemo(() => {
    if (searchQuery.trim()) {
      return new Set(groupedTopics.map((g) => g.category));
    }
    return expandedCategories;
  }, [searchQuery, groupedTopics, expandedCategories]);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleCategory = useCallback((category: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  }, []);

  const handleSubscribe = useCallback(
    async (topicId: string) => {
      setTogglingTopicId(topicId);
      try {
        const currentIds = user?.subscribedTopics.map((t) => t._id) ?? [];
        const newIds = [...currentIds, topicId];
        await updateSubscriptionsMutation.mutateAsync({ topicIds: newIds });
      } finally {
        setTogglingTopicId(null);
      }
    },
    [user?.subscribedTopics, updateSubscriptionsMutation],
  );

  const handleUnsubscribe = useCallback(
    async (topicId: string, topicName: string) => {
      const progress = progressByTopicId.get(topicId);
      const percentComplete = progress?.percentComplete ?? 0;

      // PRO users or < 10% progress: unsubscribe directly
      if (isProUser || percentComplete < 10) {
        setTogglingTopicId(topicId);
        try {
          await unsubscribeTopicMutation.mutateAsync({ topicId });
        } finally {
          setTogglingTopicId(null);
        }
        return;
      }

      // FREE users with >= 10% progress: show confirmation dialog
      setUnsubscribeDialog({ visible: true, topicId, topicName, percentComplete });
    },
    [progressByTopicId, isProUser, unsubscribeTopicMutation],
  );

  const handleUnsubscribeConfirm = useCallback(
    async (clearProgress: boolean) => {
      const { topicId } = unsubscribeDialog;
      setUnsubscribeDialog(INITIAL_DIALOG_STATE);
      setTogglingTopicId(topicId);
      try {
        await unsubscribeTopicMutation.mutateAsync({ topicId, clearProgress });
      } finally {
        setTogglingTopicId(null);
      }
    },
    [unsubscribeDialog, unsubscribeTopicMutation],
  );

  const handleToggleSubscription = useCallback(
    (topicId: string, topicName: string) => {
      const isSubscribed = subscribedIds.has(topicId);
      if (isSubscribed) {
        handleUnsubscribe(topicId, topicName);
      } else {
        handleSubscribe(topicId);
      }
    },
    [subscribedIds, handleSubscribe, handleUnsubscribe],
  );

  // ── Render helpers ──────────────────────────────────────────────────────

  const renderTopicRow = useCallback(
    (topic: Topic, isLast: boolean) => {
      const isSubscribed = subscribedIds.has(topic._id);
      const isToggling = togglingTopicId === topic._id;
      const shortName = getShortTopicName(topic.name);
      const isEmoji = topic.icon && /^[^\x00-\x7F]/.test(topic.icon);

      return (
        <View key={topic._id}>
          <View style={[styles.topicRow, { backgroundColor: theme.colors.background }]}>
            <View style={styles.topicRowLeft}>
              {isEmoji ? (
                <Text style={styles.topicEmoji}>{topic.icon}</Text>
              ) : (
                <MaterialCommunityIcons
                  name="book-open-variant"
                  size={22}
                  color={theme.colors.onSurfaceVariant}
                />
              )}
              <Text
                variant="bodyLarge"
                style={[styles.topicRowName, { color: theme.colors.onSurface }]}
                numberOfLines={1}
              >
                {shortName}
              </Text>
            </View>
            <Button
              mode={isSubscribed ? 'contained' : 'outlined'}
              onPress={() => handleToggleSubscription(topic._id, topic.name)}
              loading={isToggling}
              disabled={isToggling}
              icon={isSubscribed ? 'check' : 'plus'}
              compact
              style={styles.topicRowButton}
              labelStyle={styles.topicRowButtonLabel}
              textColor={isSubscribed ? theme.colors.onPrimary : theme.colors.primary}
              buttonColor={isSubscribed ? theme.colors.primary : undefined}
            >
              {isSubscribed ? 'Subscribed' : 'Subscribe'}
            </Button>
          </View>
          {!isLast && <Divider style={{ marginLeft: 56 }} />}
        </View>
      );
    },
    [subscribedIds, togglingTopicId, theme, handleToggleSubscription],
  );

  // ── Render ───────────────────────────────────────────────────────────────

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
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      <View style={[styles.searchContainer, { backgroundColor: theme.colors.surface, borderBottomColor: theme.colors.outlineVariant }]}>
        <Searchbar
          placeholder="Search topics..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={[styles.searchBar, { backgroundColor: theme.colors.surfaceVariant }]}
          inputStyle={styles.searchInput}
          elevation={0}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
          />
        }
      >
        {groupedTopics.length === 0 ? (
          <EmptyState
            icon="book-search-outline"
            title="No topics found"
            subtitle={
              searchQuery
                ? 'Try a different search term'
                : 'No topics available at the moment'
            }
          />
        ) : (
          <List.Section>
            {groupedTopics.map((group) => {
              const isExpanded = effectiveExpanded.has(group.category);
              const iconName = CATEGORY_ICONS[group.category] || 'folder-outline';
              const description =
                group.subscribedCount > 0
                  ? `${group.subscribedCount} of ${group.topics.length} subscribed`
                  : `${group.topics.length} topic${group.topics.length !== 1 ? 's' : ''}`;

              return (
                <View key={group.category}>
                  <List.Accordion
                    title={group.category}
                    description={description}
                    left={(props) => (
                      <List.Icon
                        {...props}
                        icon={iconName}
                        color={theme.colors.primary}
                      />
                    )}
                    expanded={isExpanded}
                    onPress={() => toggleCategory(group.category)}
                    style={[styles.accordion, { backgroundColor: theme.colors.surface }]}
                    titleStyle={styles.accordionTitle}
                    descriptionStyle={[styles.accordionDescription, { color: theme.colors.onSurfaceVariant }]}
                  >
                    {group.category === MERGED_TECH_DISPLAY_NAME
                      ? groupTechTopicsBySubcategory(group.topics).map(
                          (subGroup) => (
                            <View key={subGroup.subHeader}>
                              <List.Subheader style={[styles.techSubHeader, { color: theme.colors.onSurfaceVariant }]}>
                                {subGroup.subHeader.toUpperCase()}
                              </List.Subheader>
                              {subGroup.topics.map((topic, idx) =>
                                renderTopicRow(topic, idx === subGroup.topics.length - 1),
                              )}
                            </View>
                          ),
                        )
                      : group.topics.map((topic, index) =>
                          renderTopicRow(topic, index === group.topics.length - 1),
                        )}
                  </List.Accordion>
                  <Divider />
                </View>
              );
            })}
          </List.Section>
        )}
      </ScrollView>

      <Portal>
        <Dialog
          visible={unsubscribeDialog.visible}
          onDismiss={() => setUnsubscribeDialog(INITIAL_DIALOG_STATE)}
          style={styles.dialog}
        >
          <Dialog.Icon icon="alert-circle-outline" color={theme.colors.error} />
          <Dialog.Title style={styles.dialogTitle}>Unsubscribe from Topic?</Dialog.Title>
          <Dialog.Content>
            <Paragraph style={styles.dialogText}>
              You've completed {unsubscribeDialog.percentComplete}% of{' '}
              <Text style={{ fontWeight: '700' }}>{unsubscribeDialog.topicName}</Text>.
              {'\n\n'}
              This topic will permanently count toward your free plan limit (3 topics).
            </Paragraph>
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              onPress={() => setUnsubscribeDialog(INITIAL_DIALOG_STATE)}
              textColor={theme.colors.onSurfaceVariant}
            >
              Cancel
            </Button>
            <Button
              onPress={() => handleUnsubscribeConfirm(true)}
              textColor={theme.colors.error}
            >
              Clear Progress
            </Button>
            <Button
              mode="contained"
              onPress={() => handleUnsubscribeConfirm(false)}
            >
              Keep Progress
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  searchBar: {
    borderRadius: 12,
    height: 44,
  },
  searchInput: {
    fontSize: 14,
    minHeight: 44,
  },
  scrollContent: {
    paddingBottom: 32,
    flexGrow: 1,
  },
  accordion: {
    paddingVertical: 2,
  },
  accordionTitle: {
    fontWeight: '600',
    fontSize: 16,
  },
  accordionDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    paddingLeft: 32,
  },
  topicRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    marginRight: 12,
  },
  topicEmoji: {
    fontSize: 22,
    width: 28,
    textAlign: 'center',
  },
  topicRowName: {
    fontWeight: '500',
    flex: 1,
  },
  techSubHeader: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    paddingLeft: 36,
    paddingTop: 12,
    paddingBottom: 2,
  },
  topicRowButton: {
    borderRadius: 20,
  },
  topicRowButtonLabel: {
    fontSize: 12,
  },
  dialog: {
    borderRadius: 16,
  },
  dialogTitle: {
    textAlign: 'center',
  },
  dialogText: {
    lineHeight: 22,
  },
  dialogActions: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 4,
  },
});
