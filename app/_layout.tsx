import React, { useEffect } from 'react';
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

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.background } }}>
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
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
