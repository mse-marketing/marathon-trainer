import React, { useEffect } from 'react';
import { View, Platform, StyleSheet } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useTrainingStore } from '../src/store/useTrainingStore';
import { Colors } from '../src/theme/colors';
import { useAppFonts } from '../src/theme/fonts';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const loadStoredPlan = useTrainingStore((s) => s.loadStoredPlan);
  const [fontsLoaded] = useAppFonts();

  useEffect(() => {
    loadStoredPlan();
  }, []);

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  const stack = (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'web' ? 'none' : 'default',
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen
        name="workout/[id]"
        options={{
          headerShown: true,
          title: 'Workout',
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.textPrimary,
        }}
      />
      <Stack.Screen
        name="garmin-connect"
        options={{
          headerShown: false,
          presentation: Platform.OS === 'web' ? undefined : 'modal',
        }}
      />
    </Stack>
  );

  if (Platform.OS === 'web') {
    return (
      <View style={styles.webOuter}>
        <StatusBar style="light" />
        <View style={styles.webInner}>
          {stack}
        </View>
      </View>
    );
  }

  return (
    <>
      <StatusBar style="light" />
      {stack}
    </>
  );
}

const styles = StyleSheet.create({
  webOuter: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
  },
  webInner: {
    flex: 1,
    width: '100%',
    maxWidth: 480,
    backgroundColor: Colors.background,
    overflow: 'hidden',
  },
});
