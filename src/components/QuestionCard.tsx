import { memo } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Chip, Button, Text, ProgressBar, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../utils/constants';
import { getTopicIcon } from '../utils/icons';
import type { DailyFeedItem } from '../types';

interface QuestionCardProps {
  item: DailyFeedItem;
  onPress: () => void;
}

export const QuestionCard = memo(function QuestionCard({
  item,
  onPress,
}: QuestionCardProps) {
  const theme = useTheme();
  const isVocabulary = item.topic.contentType === 'vocabulary';
  const difficultyColor = isVocabulary
    ? '#6200EE'
    : (DIFFICULTY_COLORS[item.question.difficulty] ?? theme.colors.outline);
  const difficultyLabel = isVocabulary
    ? '15 Words'
    : (DIFFICULTY_LABELS[item.question.difficulty] ?? item.question.difficulty);
  const topicIcon = getTopicIcon(item.topic.icon ?? undefined);

  return (
    <Pressable onPress={onPress}>
      <Card style={[styles.card, { backgroundColor: theme.colors.surface }]} mode="elevated">
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.topicRow}>
              <MaterialCommunityIcons
                name={topicIcon}
                size={20}
                color={theme.colors.primary}
              />
              <Text
                variant="labelLarge"
                style={[styles.topicName, { color: theme.colors.primary }]}
              >
                {item.topic.name}
              </Text>
            </View>
            <View style={styles.chipRow}>
              {item.progress?.isRead ? (
                <Chip
                  compact
                  icon="check-circle"
                  textStyle={styles.solvedText}
                  style={styles.solvedChip}
                >
                  Solved
                </Chip>
              ) : null}
              <Chip
                compact
                textStyle={styles.difficultyText}
                style={[
                  styles.difficultyChip,
                  { backgroundColor: `${difficultyColor}20` },
                ]}
              >
                <Text
                  style={{
                    color: difficultyColor,
                    fontSize: 11,
                    fontWeight: '600',
                  }}
                >
                  {difficultyLabel}
                </Text>
              </Chip>
            </View>
          </View>

          <Text
            variant="bodyLarge"
            style={[styles.questionText, { color: theme.colors.onSurface }]}
            numberOfLines={3}
          >
            {item.question.text}
          </Text>

          {!isVocabulary && item.question.tags.length > 0 ? (
            <View style={styles.tagsRow}>
              {item.question.tags.slice(0, 3).map((tag) => (
                <Chip
                  key={tag}
                  compact
                  style={[styles.tagChip, { backgroundColor: theme.colors.primaryContainer }]}
                  textStyle={[styles.tagText, { color: theme.colors.primary }]}
                >
                  {tag}
                </Chip>
              ))}
              {item.question.tags.length > 3 ? (
                <Text variant="bodySmall" style={[styles.moreTagsText, { color: theme.colors.onSurfaceVariant }]}>
                  +{item.question.tags.length - 3}
                </Text>
              ) : null}
            </View>
          ) : null}

          {item.progress ? (
            <View style={styles.progressSection}>
              <View style={styles.progressLabelRow}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {isVocabulary ? 'Day' : 'Question'} {item.progress.questionsAnswered + 1} of {item.progress.totalQuestions}
                </Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {item.progress.totalQuestions > 0
                    ? Math.round((item.progress.questionsAnswered / item.progress.totalQuestions) * 100)
                    : 0}%
                </Text>
              </View>
              <ProgressBar
                progress={
                  item.progress.totalQuestions > 0
                    ? item.progress.questionsAnswered / item.progress.totalQuestions
                    : 0
                }
                color={theme.colors.primary}
                style={styles.progressBar}
              />
            </View>
          ) : null}
        </Card.Content>

        <Card.Actions style={styles.cardActions}>
          <Button
            mode="text"
            compact
            icon={item.progress?.isRead ? 'eye-outline' : (isVocabulary ? 'book-open-variant' : 'arrow-right')}
            onPress={onPress}
            contentStyle={styles.viewButtonContent}
          >
            {item.progress?.isRead ? 'View Answer' : (isVocabulary ? 'Study Words' : 'Attempt Quiz')}
          </Button>
        </Card.Actions>
      </Card>
    </Pressable>
  );
});

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  topicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  topicName: {
    fontWeight: '600',
  },
  chipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  solvedChip: {
    height: 30,
    backgroundColor: '#E8F5E9',
  },
  solvedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4CAF50',
  },
  difficultyChip: {
    height: 30,
  },
  difficultyText: {
    fontSize: 11,
    fontWeight: '600',
  },
  questionText: {
    lineHeight: 24,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 12,
    alignItems: 'center',
  },
  tagChip: {
    height: 28,
  },
  tagText: {
    fontSize: 11,
  },
  moreTagsText: {},
  progressSection: {
    marginTop: 12,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  viewButtonContent: {
    flexDirection: 'row-reverse',
  },
});
