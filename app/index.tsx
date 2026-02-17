import React from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { useTrainingStore } from '../src/store/useTrainingStore';
import { Colors } from '../src/theme/colors';

export default function IndexScreen() {
  const isLoading = useTrainingStore((s) => s.isLoading);
  const onboardingComplete = useTrainingStore((s) => s.onboardingComplete);

  if (isLoading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (onboardingComplete) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/onboarding" />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.background,
  },
});
