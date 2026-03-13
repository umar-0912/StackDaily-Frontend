import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, useTheme } from 'react-native-paper';
import { useAuthStore } from '../../src/stores/authStore';

/** Streak shown in the purple header bar of the Feed tab */
function HeaderStreak() {
  const user = useAuthStore((state) => state.user);
  const count = user?.streak?.count ?? 0;
  const maxStreak = user?.streak?.maxStreak ?? 0;

  return (
    <View style={headerStyles.container}>
      <View style={headerStyles.stat}>
        <MaterialCommunityIcons name="fire" size={20} color="#FFB74D" />
        <Text style={headerStyles.count}>{count}</Text>
      </View>
      {maxStreak > 0 && (
        <>
          <View style={headerStyles.divider} />
          <View style={headerStyles.stat}>
            <MaterialCommunityIcons name="trophy" size={17} color="#FFC107" />
            <Text style={headerStyles.count}>{maxStreak}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const headerStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    gap: 8,
    marginRight: 8,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  divider: {
    width: 1,
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  count: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default function TabsLayout() {
  const theme = useTheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.colors.primary,
        tabBarInactiveTintColor: theme.colors.outline,
        tabBarStyle: {
          backgroundColor: theme.colors.surface,
          borderTopColor: theme.colors.surfaceVariant,
          elevation: 8,
          height: 60,
          paddingBottom: 8,
          paddingTop: 4,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerStyle: {
          backgroundColor: theme.colors.primary,
        },
        headerTintColor: theme.colors.onPrimary,
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        options={{
          title: 'Feed',
          headerTitle: 'Daily Feed',
          headerRight: () => <HeaderStreak />,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="topics"
        options={{
          title: 'Topics',
          headerTitle: 'Topics',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="book-open-variant"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          headerTitle: 'My Profile',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons
              name="account-circle"
              color={color}
              size={size}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="question/[id]"
        options={{
          href: null,
          headerShown: false,
        }}
      />
    </Tabs>
  );
}
