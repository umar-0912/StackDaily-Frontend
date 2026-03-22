import { Stack } from 'expo-router';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#FAFAFA' },
        animation: 'fade',
      }}
    >
      <Stack.Screen name="welcome" />
    </Stack>
  );
}
