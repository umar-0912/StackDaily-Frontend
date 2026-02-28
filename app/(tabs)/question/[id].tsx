import { useState, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import {
  Text,
  Chip,
  Surface,
  ActivityIndicator,
  Button,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { questionsApi } from '../../../src/api/questions';
import { aiAnswersApi } from '../../../src/api/ai-answers';
import { QUERY_KEYS, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../../src/utils/constants';
import { getTopicIcon } from '../../../src/utils/icons';
import { useMarkRead } from '../../../src/hooks/useFeed';
import type { DailyFeedItem } from '../../../src/types';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

function AnswerSection({ answer }: { answer: { content: string; generatedAt: string } }) {
  const [expanded, setExpanded] = useState(false);

  const toggleExpanded = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpanded((prev) => !prev);
  }, []);

  const formattedDate = new Date(answer.generatedAt).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    },
  );

  return (
    <Surface style={styles.answerSection} elevation={1}>
      <Pressable onPress={toggleExpanded} style={styles.answerHeader}>
        <View style={styles.answerHeaderLeft}>
          <MaterialCommunityIcons
            name="robot-outline"
            size={22}
            color="#6200EE"
          />
          <Text variant="titleMedium" style={styles.answerTitle}>
            AI Answer
          </Text>
        </View>
        <MaterialCommunityIcons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color="#666"
        />
      </Pressable>

      {expanded ? (
        <View style={styles.answerBody}>
          <Divider style={styles.answerDivider} />
          <Text variant="bodyLarge" style={styles.answerContent}>
            {answer.content}
          </Text>
          <Text variant="bodySmall" style={styles.answerDate}>
            Generated on {formattedDate}
          </Text>
        </View>
      ) : (
        <Text variant="bodySmall" style={styles.tapHint}>
          Tap to reveal the answer
        </Text>
      )}
    </Surface>
  );
}

export default function QuestionDetailScreen() {
  const { id, feedItem: feedItemParam } = useLocalSearchParams<{
    id: string;
    feedItem?: string;
  }>();
  const router = useRouter();
  const markReadMutation = useMarkRead();
  const [snackbarVisible, setSnackbarVisible] = useState(false);

  // Try to parse passed data first (wrapped in try/catch for safety)
  let parsedItem: DailyFeedItem | null = null;
  if (feedItemParam) {
    try {
      parsedItem = JSON.parse(feedItemParam) as DailyFeedItem;
    } catch {
      parsedItem = null;
    }
  }

  // Fallback: fetch from dedicated API endpoints when params aren't available (e.g., deep link)
  const {
    data: fetchedItem,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [...QUERY_KEYS.question(id ?? ''), 'detail'],
    queryFn: async () => {
      const [questionRes, answerRes] = await Promise.all([
        questionsApi.getQuestion(id!),
        aiAnswersApi.getAnswer(id!),
      ]);

      const question = questionRes.data;
      const aiAnswer = answerRes.data;

      // Build a DailyFeedItem-compatible object from the API responses
      const item: DailyFeedItem = {
        dailySelectionId: id!,
        topic: {
          name: question.topicId.name,
          slug: question.topicId.slug,
          icon: null,
        },
        question: {
          text: question.text,
          difficulty: question.difficulty,
          tags: question.tags,
        },
        answer: {
          content: aiAnswer.answer,
          generatedAt: aiAnswer.generatedAt,
        },
      };
      return item;
    },
    enabled: !!id && !parsedItem,
  });

  const feedItem = parsedItem ?? fetchedItem;

  const [snackbarMessage, setSnackbarMessage] = useState('');

  const handleMarkRead = useCallback(() => {
    if (!id) return;
    markReadMutation.mutate(id, {
      onSuccess: () => {
        setSnackbarMessage('Marked as read! Streak updated.');
        setSnackbarVisible(true);
      },
      onError: () => {
        setSnackbarMessage('Failed to mark as read. Please try again.');
        setSnackbarVisible(true);
      },
    });
  }, [id, markReadMutation]);

  if (!parsedItem && isLoading) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Question',
            headerStyle: { backgroundColor: '#6200EE' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text variant="bodyLarge" style={styles.loadingText}>
              Loading question...
            </Text>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!parsedItem && (isError || !feedItem)) {
    return (
      <>
        <Stack.Screen
          options={{
            headerShown: true,
            title: 'Question',
            headerStyle: { backgroundColor: '#6200EE' },
            headerTintColor: '#FFFFFF',
          }}
        />
        <SafeAreaView style={styles.container} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <MaterialCommunityIcons
              name="alert-circle-outline"
              size={64}
              color="#B00020"
            />
            <Text variant="titleMedium" style={styles.errorTitle}>
              Could not load question
            </Text>
            <Text variant="bodyMedium" style={styles.errorSubtitle}>
              The question may no longer be available.
            </Text>
            <View style={styles.errorActions}>
              <Button mode="contained" onPress={() => refetch()}>
                Retry
              </Button>
              <Button mode="outlined" onPress={() => router.back()}>
                Go Back
              </Button>
            </View>
          </View>
        </SafeAreaView>
      </>
    );
  }

  if (!feedItem) return null;

  const difficultyColor =
    DIFFICULTY_COLORS[feedItem.question.difficulty] ?? '#999';
  const difficultyLabel =
    DIFFICULTY_LABELS[feedItem.question.difficulty] ??
    feedItem.question.difficulty;
  const topicIcon = getTopicIcon(feedItem.topic.icon ?? undefined);

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          title: feedItem.topic.name,
          headerStyle: { backgroundColor: '#6200EE' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '600' },
        }}
      />
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Topic & Difficulty Header */}
          <Surface style={styles.metaCard} elevation={1}>
            <View style={styles.metaRow}>
              <View style={styles.topicRow}>
                <MaterialCommunityIcons
                  name={topicIcon}
                  size={24}
                  color="#6200EE"
                />
                <Text variant="titleMedium" style={styles.topicName}>
                  {feedItem.topic.name}
                </Text>
              </View>
              <Chip
                compact
                style={[
                  styles.difficultyChip,
                  { backgroundColor: `${difficultyColor}20` },
                ]}
              >
                <Text
                  style={{
                    color: difficultyColor,
                    fontSize: 12,
                    fontWeight: '600',
                  }}
                >
                  {difficultyLabel}
                </Text>
              </Chip>
            </View>
          </Surface>

          {/* Question */}
          <Surface style={styles.questionCard} elevation={1}>
            <View style={styles.questionIconRow}>
              <MaterialCommunityIcons
                name="help-circle-outline"
                size={22}
                color="#6200EE"
              />
              <Text variant="labelLarge" style={styles.questionLabel}>
                Question
              </Text>
            </View>
            <Text variant="headlineSmall" style={styles.questionText}>
              {feedItem.question.text}
            </Text>
          </Surface>

          {/* Tags */}
          {feedItem.question.tags.length > 0 ? (
            <View style={styles.tagsSection}>
              <Text variant="labelMedium" style={styles.tagsLabel}>
                Tags
              </Text>
              <View style={styles.tagsRow}>
                {feedItem.question.tags.map((tag) => (
                  <Chip
                    key={tag}
                    compact
                    style={styles.tagChip}
                    textStyle={styles.tagText}
                    icon="tag-outline"
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
            </View>
          ) : null}

          {/* AI Answer (Expandable) */}
          <AnswerSection answer={feedItem.answer} />

          {/* Mark as Read Button */}
          <Button
            mode="contained"
            onPress={handleMarkRead}
            loading={markReadMutation.isPending}
            disabled={markReadMutation.isPending}
            style={styles.markReadButton}
            icon="check-circle-outline"
            buttonColor="#4CAF50"
          >
            Mark as Read
          </Button>

          {/* Back Button */}
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.backButton}
            icon="arrow-left"
          >
            Back to Feed
          </Button>
        </ScrollView>

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
    </>
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorTitle: {
    fontWeight: '600',
    marginTop: 16,
  },
  errorSubtitle: {
    color: '#666',
    marginTop: 8,
    textAlign: 'center',
  },
  errorActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  metaCard: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topicName: {
    fontWeight: '600',
    color: '#6200EE',
  },
  difficultyChip: {
    height: 30,
  },
  questionCard: {
    borderRadius: 12,
    padding: 20,
    backgroundColor: '#FFFFFF',
    marginBottom: 12,
  },
  questionIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  questionLabel: {
    color: '#6200EE',
    fontWeight: '600',
  },
  questionText: {
    color: '#1C1B1F',
    lineHeight: 32,
    fontWeight: '500',
  },
  tagsSection: {
    marginBottom: 12,
  },
  tagsLabel: {
    color: '#999',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tagChip: {
    backgroundColor: '#F0EAF8',
  },
  tagText: {
    fontSize: 12,
    color: '#6200EE',
  },
  answerSection: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  answerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  answerHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  answerTitle: {
    fontWeight: '600',
    color: '#6200EE',
  },
  tapHint: {
    color: '#999',
    marginTop: 8,
    fontStyle: 'italic',
  },
  answerBody: {
    marginTop: 4,
  },
  answerDivider: {
    marginVertical: 12,
  },
  answerContent: {
    color: '#333',
    lineHeight: 26,
  },
  answerDate: {
    color: '#999',
    marginTop: 12,
    textAlign: 'right',
  },
  markReadButton: {
    marginBottom: 12,
  },
  backButton: {
    marginTop: 0,
  },
});
