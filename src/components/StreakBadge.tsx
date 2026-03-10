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

export function StreakBadge({ count, maxStreak = 0, size = 'small' }: StreakBadgeProps) {
  const theme = useTheme();
  const fireColor = getFireColor(count);
  const isLarge = size === 'large';

  if (isLarge) {
    return (
      <Surface style={[styles.largeContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={2}>
        <View style={styles.largeStatsRow}>
          <View style={styles.largeStat}>
            <MaterialCommunityIcons name="fire" size={40} color={fireColor} />
            <Text variant="displaySmall" style={[styles.largeCount, { color: fireColor }]}>
              {count}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Current Streak
            </Text>
          </View>
          <View style={[styles.largeDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.largeStat}>
            <MaterialCommunityIcons name="trophy" size={40} color="#FFC107" />
            <Text variant="displaySmall" style={[styles.largeCount, { color: '#FFC107' }]}>
              {maxStreak}
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Best Streak
            </Text>
          </View>
        </View>
      </Surface>
    );
  }

  return (
    <Surface style={[styles.smallContainer, { backgroundColor: theme.colors.surfaceVariant }]} elevation={1}>
      <View style={styles.smallStat}>
        <MaterialCommunityIcons name="fire" size={22} color={fireColor} />
        <Text variant="titleMedium" style={[styles.smallCount, { color: fireColor }]}>
          {count}
        </Text>
      </View>
      {maxStreak > 0 && (
        <>
          <View style={[styles.smallDivider, { backgroundColor: theme.colors.outlineVariant }]} />
          <View style={styles.smallStat}>
            <MaterialCommunityIcons name="trophy" size={18} color="#FFC107" />
            <Text variant="bodyMedium" style={[styles.smallCount, { color: '#FFC107' }]}>
              {maxStreak}
            </Text>
          </View>
        </>
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 14,
    gap: 10,
    alignSelf: 'flex-start',
  },
  smallStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  smallDivider: {
    width: 1,
    height: 20,
  },
  smallCount: {
    fontWeight: '700',
  },
  largeContainer: {
    borderRadius: 16,
    padding: 24,
  },
  largeStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
  },
  largeStat: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  largeDivider: {
    width: 1,
    height: 80,
  },
  largeCount: {
    fontWeight: '700',
  },
});
