import { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
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
import Markdown from 'react-native-markdown-display';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { questionsApi } from '../../../src/api/questions';
import { aiAnswersApi } from '../../../src/api/ai-answers';
import { QUERY_KEYS, DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../../../src/utils/constants';
import { getTopicIcon } from '../../../src/utils/icons';
import { useMarkRead, useNextQuestion } from '../../../src/hooks/useFeed';
import { McqQuiz } from '../../../src/components/McqQuiz';
import { AdBanner } from '../../../src/components';
import { AD_UNIT_IDS } from '../../../src/utils/adConfig';
import { useInterstitialAd } from '../../../src/hooks/useInterstitialAd';
import type { DailyFeedItem } from '../../../src/types';

const markdownStyles = {
  body: { color: '#333', fontSize: 15, lineHeight: 24 },
  heading1: { color: '#1A1A2E', fontSize: 22, fontWeight: '700' as const, marginBottom: 8, marginTop: 16 },
  heading2: { color: '#1A1A2E', fontSize: 19, fontWeight: '600' as const, marginBottom: 6, marginTop: 14 },
  heading3: { color: '#1A1A2E', fontSize: 17, fontWeight: '600' as const, marginBottom: 4, marginTop: 12 },
  code_inline: { backgroundColor: '#F0F4F8', color: '#0D47A1', paddingHorizontal: 4, borderRadius: 4, fontSize: 14 },
  code_block: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 13, color: '#333' },
  fence: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 13, color: '#333' },
  bullet_list: { marginVertical: 4 },
  ordered_list: { marginVertical: 4 },
  list_item: { marginVertical: 2 },
  strong: { fontWeight: '700' as const },
  blockquote: { backgroundColor: '#F5F5F5', borderLeftWidth: 3, borderLeftColor: '#03DAC6', paddingLeft: 12, paddingVertical: 8, marginVertical: 8 },
};

function AnswerSection({ answer }: { answer: { content: string; generatedAt: string } }) {
  const formattedDate = new Date(answer.generatedAt).toLocaleDateString(
    'en-US',
    { year: 'numeric', month: 'short', day: 'numeric' },
  );

  return (
    <Surface style={styles.answerSection} elevation={1}>
      <View style={styles.answerHeader}>
        <View style={styles.answerHeaderLeft}>
          <MaterialCommunityIcons name="lightbulb-outline" size={22} color="#6200EE" />
          <Text variant="titleMedium" style={styles.answerTitle}>
            Answer
          </Text>
        </View>
      </View>
      <Divider style={styles.answerDivider} />
      <Markdown style={markdownStyles}>{answer.content}</Markdown>
      <Text variant="bodySmall" style={styles.answerDate}>
        Updated on {formattedDate}
      </Text>
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
  const nextQuestionMutation = useNextQuestion();
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [nextUnlocked, setNextUnlocked] = useState(false);
  const [canShowNext, setCanShowNext] = useState(false);
  const [overrideFeedItem, setOverrideFeedItem] = useState<DailyFeedItem | null>(null);
  const [questionVersion, setQuestionVersion] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const { showAd } = useInterstitialAd();

  // Reset stale state when navigating to a different question
  useEffect(() => {
    markReadMutation.reset();
    nextQuestionMutation.reset();
    setCanShowNext(false);
    setNextUnlocked(false);
    setOverrideFeedItem(null);
    setQuestionVersion(0);
  }, [id]);

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

      const item: DailyFeedItem = {
        dailySelectionId: id!,
        topic: {
          _id: question.topicId._id ?? '',
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
          mcqs: aiAnswer.mcqs || [],
        },
        progress: {
          status: 'not_started',
          questionsAnswered: 0,
          totalQuestions: 0,
          currentDifficulty: question.difficulty,
        },
      };
      return item;
    },
    enabled: !!id && !parsedItem,
  });

  const feedItem = overrideFeedItem ?? parsedItem ?? fetchedItem;

  // Use the correct dailySelectionId (override may have a different one)
  const activeDailySelectionId = overrideFeedItem?.dailySelectionId ?? id;

  /**
   * Quiz submit flow: show interstitial ad → after ad closes → fire
   * mark-read mutation + reveal quiz results (McqQuiz awaits this promise).
   */
  const handleQuizSubmit = useCallback((): Promise<void> => {
    return new Promise<void>((resolve) => {
      if (!activeDailySelectionId || !feedItem || markReadMutation.isPending || markReadMutation.isSuccess) {
        resolve();
        return;
      }
      // Ad opens immediately. When user dismisses it, the callback fires:
      // mutation dispatches and the promise resolves so McqQuiz reveals results.
      showAd(() => {
        markReadMutation.mutate(
          { dailySelectionId: activeDailySelectionId, topicId: feedItem.topic._id },
          {
            onSuccess: (data) => {
              setCanShowNext(data.canAdvance);
              setSnackbarMessage('Great job! Progress saved.');
              setSnackbarVisible(true);
            },
            onError: () => {
              setSnackbarMessage('Failed to save progress. Please try again.');
              setSnackbarVisible(true);
            },
          },
        );
        resolve(); // Results show immediately after ad — mutation runs in background
      });
    });
  }, [activeDailySelectionId, feedItem, markReadMutation, showAd]);

  const handleMarkRead = useCallback(() => {
    if (!activeDailySelectionId || !feedItem) return;
    markReadMutation.mutate(
      { dailySelectionId: activeDailySelectionId, topicId: feedItem.topic._id },
      {
        onSuccess: () => {
          setSnackbarMessage('Marked as read! Streak updated.');
          setSnackbarVisible(true);
        },
        onError: () => {
          setSnackbarMessage('Failed to mark as read. Please try again.');
          setSnackbarVisible(true);
        },
      },
    );
  }, [activeDailySelectionId, feedItem, markReadMutation]);

  /**
   * Next question flow: show interstitial ad → after ad closes → fire
   * next-question mutation → swap question in-place.
   */
  const handleNextQuestion = useCallback(() => {
    if (!feedItem || nextQuestionMutation.isPending) return;
    // Ad opens immediately. When user dismisses it, the callback fires
    // and the mutation fetches + swaps the next question in-place.
    // If ad isn't loaded (reload still in progress), callback fires
    // immediately so the user isn't blocked.
    showAd(() => {
      nextQuestionMutation.mutate(
        { topicId: feedItem.topic._id },
        {
          onSuccess: (data) => {
            if (data && 'question' in data) {
              setOverrideFeedItem(data as DailyFeedItem);
              setCanShowNext(false);
              setNextUnlocked(false);
              markReadMutation.reset();
              nextQuestionMutation.reset();
              setQuestionVersion((v) => v + 1);
              scrollViewRef.current?.scrollTo({ y: 0, animated: true });
              setSnackbarMessage('Next question unlocked!');
            } else {
              setSnackbarMessage((data as any)?.message ?? 'Already advanced today.');
            }
            setSnackbarVisible(true);
          },
          onError: () => {
            setSnackbarMessage('Could not unlock next question. Try again.');
            setSnackbarVisible(true);
          },
        },
      );
    });
  }, [feedItem, nextQuestionMutation, showAd, markReadMutation]);

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
  const hasMcqs = feedItem.answer.mcqs && feedItem.answer.mcqs.length > 0;

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
          ref={scrollViewRef}
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
                  color="#1A1A2E"
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

          {/* AI Answer (always visible, markdown rendered) */}
          <AnswerSection answer={feedItem.answer} />

          {/* MCQ Quiz or fallback "I've Read This" button */}
          {hasMcqs ? (
            <McqQuiz key={`${id}-${questionVersion}`} mcqs={feedItem.answer.mcqs!} onSubmit={handleQuizSubmit} />
          ) : (
            <Button
              mode="contained"
              onPress={handleMarkRead}
              loading={markReadMutation.isPending}
              disabled={markReadMutation.isPending || markReadMutation.isSuccess}
              style={styles.markReadButton}
              icon="check-circle-outline"
              buttonColor="#4CAF50"
            >
              I've Read This
            </Button>
          )}

          {/* Show Next Question — visible only if backend says canAdvance */}
          {(canShowNext || feedItem.progress?.canAdvance) &&
            !nextUnlocked ? (
            <Button
              mode="contained"
              onPress={handleNextQuestion}
              loading={nextQuestionMutation.isPending}
              disabled={nextQuestionMutation.isPending}
              style={styles.nextQuestionButton}
              icon="play-circle-outline"
              buttonColor="#03DAC6"
              textColor="#000"
            >
              Show Next Question
            </Button>
          ) : null}

          {/* Back Button */}
          <Button
            mode="outlined"
            onPress={() => router.back()}
            style={styles.backButton}
            icon="arrow-left"
          >
            Back to Feed
          </Button>

          {/* Banner Ad */}
          <AdBanner unitId={AD_UNIT_IDS.QUESTION_BANNER} />
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
    color: '#1A1A2E',
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
    backgroundColor: '#E0F7FA',
  },
  tagText: {
    fontSize: 12,
    color: '#00796B',
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
    color: '#1A1A2E',
  },
  answerDivider: {
    marginVertical: 12,
  },
  answerDate: {
    color: '#999',
    marginTop: 12,
    textAlign: 'right',
  },
  markReadButton: {
    marginBottom: 12,
  },
  nextQuestionButton: {
    marginBottom: 12,
  },
  backButton: {
    marginTop: 0,
  },
});
