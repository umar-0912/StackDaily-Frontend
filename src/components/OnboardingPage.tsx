import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

interface OnboardingPageProps {
  children: React.ReactNode;
}

export default function OnboardingPage({ children }: OnboardingPageProps) {
  return (
    <View style={styles.page}>
      <SafeAreaView style={styles.safeArea}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    width,
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: 32,
    justifyContent: 'center',
  },
});
