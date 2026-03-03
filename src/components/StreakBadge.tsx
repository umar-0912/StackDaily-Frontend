import { View, StyleSheet } from 'react-native';
import { Text, Surface, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface StreakBadgeProps {
  count: number;
  maxStreak?: number;
  size?: 'small' | 'large';
}

// Keep streak fire colors as brand-specific colors
function getFireColor(count: number): string {
  if (count >= 30) return '#D32F2F';
  if (count >= 14) return '#E64A19';
  if (count >= 7) return '#F57C00';
  if (count >= 3) return '#FF9800';
  return '#FFB74D';
}

export function StreakBadge({ count, maxStreak, size = 'small' }: StreakBadgeProps) {
  const theme = useTheme();
  const fireColor = getFireColor(count);
  const isLarge = size === 'large';

  if (isLarge) {
    return (
      <Surface style={[styles.largeContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
        <MaterialCommunityIcons name="fire" size={48} color={fireColor} />
        <Text variant="displaySmall" style={[styles.largeCount, { color: fireColor }]}>
          {count}
        </Text>
        <Text variant="titleMedium" style={[styles.largeLabel, { color: theme.colors.onSurfaceVariant }]}>
          Day Streak
        </Text>
        {maxStreak !== undefined && maxStreak > 0 && (
          <Text variant="bodySmall" style={[styles.bestStreak, { color: theme.colors.onSurfaceVariant }]}>
            Best: {maxStreak} days
          </Text>
        )}
      </Surface>
    );
  }

  return (
    <Surface style={[styles.smallContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
      <MaterialCommunityIcons name="fire" size={24} color={fireColor} />
      <View>
        <Text variant="titleMedium" style={[styles.smallCount, { color: fireColor }]}>
          {count}
        </Text>
        <Text variant="bodySmall" style={[styles.smallLabel, { color: theme.colors.onSurfaceVariant }]}>
          Day Streak
        </Text>
      </View>
    </Surface>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    gap: 10,
    alignSelf: 'flex-start',
  },
  smallCount: {
    fontWeight: '700',
    lineHeight: 20,
  },
  smallLabel: {
    lineHeight: 14,
  },
  largeContainer: {
    alignItems: 'center',
    borderRadius: 16,
    padding: 24,
    gap: 4,
  },
  largeCount: {
    fontWeight: '700',
  },
  largeLabel: {
    fontWeight: '500',
  },
  bestStreak: {
    marginTop: 4,
    fontStyle: 'italic',
  },
});
