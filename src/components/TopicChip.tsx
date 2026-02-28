import { StyleSheet } from 'react-native';
import { Chip, useTheme } from 'react-native-paper';
import type { PopulatedTopic, Topic } from '../types';

interface TopicChipProps {
  topic: PopulatedTopic | Topic;
  selected?: boolean;
  onPress?: () => void;
}

export function TopicChip({ topic, selected = false, onPress }: TopicChipProps) {
  const theme = useTheme();
  const iconName = topic.icon ?? 'book-open-variant';

  return (
    <Chip
      mode={selected ? 'flat' : 'outlined'}
      selected={selected}
      onPress={onPress}
      icon={iconName}
      style={[
        styles.chip,
        selected && {
          backgroundColor: theme.colors.primaryContainer,
        },
      ]}
      textStyle={[
        styles.chipText,
        selected && { color: theme.colors.primary },
      ]}
      selectedColor={theme.colors.primary}
    >
      {topic.name}
    </Chip>
  );
}

const styles = StyleSheet.create({
  chip: {
    marginRight: 8,
    marginBottom: 8,
  },
  chipText: {
    fontSize: 13,
  },
});
