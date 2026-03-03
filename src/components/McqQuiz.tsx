import { useState, useCallback } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, Surface, Button, Chip } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { FeedMcq } from '../types';

interface McqQuizProps {
  mcqs: FeedMcq[];
  onSubmit: () => void;
}

export function McqQuiz({ mcqs, onSubmit }: McqQuizProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [submitted, setSubmitted] = useState(false);

  const allAnswered = Object.keys(selectedAnswers).length === mcqs.length;

  const handleSelect = useCallback(
    (mcqIndex: number, optionIndex: number) => {
      if (submitted) return;
      setSelectedAnswers((prev) => ({ ...prev, [mcqIndex]: optionIndex }));
    },
    [submitted],
  );

  const handleSubmit = useCallback(() => {
    if (!allAnswered || submitted) return;
    setSubmitted(true);
    onSubmit();
  }, [allAnswered, submitted, onSubmit]);

  const correctCount = submitted
    ? mcqs.filter((mcq, i) => selectedAnswers[i] === mcq.correctIndex).length
    : 0;

  return (
    <Surface style={styles.container} elevation={1}>
      {/* Header */}
      <View style={styles.header}>
        <MaterialCommunityIcons name="head-question-outline" size={22} color="#6200EE" />
        <Text variant="titleMedium" style={styles.headerTitle}>
          Quick Quiz
        </Text>
        <Chip compact style={styles.countChip}>
          <Text style={styles.countText}>{mcqs.length} Questions</Text>
        </Chip>
      </View>

      {/* MCQ List */}
      {mcqs.map((mcq, mcqIndex) => {
        const selected = selectedAnswers[mcqIndex];
        const isCorrectAnswer = submitted && selected === mcq.correctIndex;
        const isWrongAnswer = submitted && selected !== undefined && selected !== mcq.correctIndex;

        return (
          <View key={mcqIndex} style={styles.mcqItem}>
            <Text variant="titleSmall" style={styles.mcqQuestion}>
              {mcqIndex + 1}. {mcq.question}
            </Text>

            {mcq.options.map((option, optionIndex) => {
              const isSelected = selected === optionIndex;
              const isCorrectOption = mcq.correctIndex === optionIndex;

              let optionStyle = styles.optionDefault;
              let iconName: 'radiobox-blank' | 'radiobox-marked' | 'check-circle' | 'close-circle' = 'radiobox-blank';
              let iconColor = '#999';

              if (submitted) {
                if (isCorrectOption) {
                  optionStyle = styles.optionCorrect;
                  iconName = 'check-circle';
                  iconColor = '#4CAF50';
                } else if (isSelected && !isCorrectOption) {
                  optionStyle = styles.optionWrong;
                  iconName = 'close-circle';
                  iconColor = '#F44336';
                }
              } else if (isSelected) {
                optionStyle = styles.optionSelected;
                iconName = 'radiobox-marked';
                iconColor = '#6200EE';
              }

              return (
                <Pressable
                  key={optionIndex}
                  onPress={() => handleSelect(mcqIndex, optionIndex)}
                  disabled={submitted}
                  style={[styles.optionRow, optionStyle]}
                >
                  <MaterialCommunityIcons name={iconName} size={20} color={iconColor} />
                  <Text
                    variant="bodyMedium"
                    style={[
                      styles.optionText,
                      submitted && isCorrectOption && styles.optionTextCorrect,
                      submitted && isSelected && !isCorrectOption && styles.optionTextWrong,
                    ]}
                  >
                    {option}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        );
      })}

      {/* Submit Button or Score */}
      {!submitted ? (
        <Button
          mode="contained"
          onPress={handleSubmit}
          disabled={!allAnswered}
          style={styles.submitButton}
          buttonColor="#6200EE"
          icon="send"
        >
          Submit Quiz
        </Button>
      ) : (
        <Surface style={styles.scoreCard} elevation={0}>
          <MaterialCommunityIcons
            name={correctCount === mcqs.length ? 'trophy' : 'check-decagram'}
            size={28}
            color={correctCount === mcqs.length ? '#FF9800' : '#4CAF50'}
          />
          <Text variant="titleMedium" style={styles.scoreText}>
            You got {correctCount} out of {mcqs.length} correct
          </Text>
        </Surface>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  headerTitle: {
    fontWeight: '600',
    color: '#6200EE',
    flex: 1,
  },
  countChip: {
    backgroundColor: '#F0EAF8',
  },
  countText: {
    fontSize: 12,
    color: '#6200EE',
  },
  mcqItem: {
    marginBottom: 16,
  },
  mcqQuestion: {
    fontWeight: '600',
    color: '#1C1B1F',
    marginBottom: 8,
    lineHeight: 22,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 6,
    borderWidth: 1,
  },
  optionDefault: {
    backgroundColor: '#FAFAFA',
    borderColor: '#E0E0E0',
  },
  optionSelected: {
    backgroundColor: '#F0EAF8',
    borderColor: '#6200EE',
  },
  optionCorrect: {
    backgroundColor: '#E8F5E9',
    borderColor: '#4CAF50',
  },
  optionWrong: {
    backgroundColor: '#FFEBEE',
    borderColor: '#F44336',
  },
  optionText: {
    flex: 1,
    color: '#333',
    lineHeight: 20,
  },
  optionTextCorrect: {
    color: '#2E7D32',
    fontWeight: '600',
  },
  optionTextWrong: {
    color: '#C62828',
    fontWeight: '600',
  },
  submitButton: {
    marginTop: 4,
  },
  scoreCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 16,
    borderRadius: 10,
    backgroundColor: '#F5F5F5',
    marginTop: 4,
  },
  scoreText: {
    fontWeight: '600',
    color: '#333',
  },
});
