import { View, StyleSheet, Pressable } from 'react-native';
import { Card, Chip, Button, Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { DIFFICULTY_COLORS, DIFFICULTY_LABELS } from '../utils/constants';
import { getTopicIcon } from '../utils/icons';
import type { DailyFeedItem } from '../types';

interface QuestionCardProps {
  item: DailyFeedItem;
  onPress: () => void;
  onMarkRead?: () => void;
  isMarkingRead?: boolean;
}

export function QuestionCard({
  item,
  onPress,
  onMarkRead,
  isMarkingRead = false,
}: QuestionCardProps) {
  const theme = useTheme();
  const difficultyColor =
    DIFFICULTY_COLORS[item.question.difficulty] ?? theme.colors.outline;
  const difficultyLabel =
    DIFFICULTY_LABELS[item.question.difficulty] ?? item.question.difficulty;
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

          <Text
            variant="bodyLarge"
            style={[styles.questionText, { color: theme.colors.onSurface }]}
            numberOfLines={3}
          >
            {item.question.text}
          </Text>

          {item.question.tags.length > 0 ? (
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
        </Card.Content>

        {onMarkRead ? (
          <Card.Actions style={styles.cardActions}>
            <Button
              mode="text"
              compact
              icon="check-circle-outline"
              onPress={onMarkRead}
              loading={isMarkingRead}
              disabled={isMarkingRead}
              textColor="#4CAF50"
            >
              Mark Read
            </Button>
            <Button
              mode="text"
              compact
              icon="arrow-right"
              onPress={onPress}
              contentStyle={styles.viewButtonContent}
            >
              View Answer
            </Button>
          </Card.Actions>
        ) : null}
      </Card>
    </Pressable>
  );
}

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
  difficultyChip: {
    height: 28,
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
    height: 26,
  },
  tagText: {
    fontSize: 11,
  },
  moreTagsText: {},
  cardActions: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  viewButtonContent: {
    flexDirection: 'row-reverse',
  },
});
