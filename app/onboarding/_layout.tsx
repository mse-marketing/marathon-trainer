import { Stack } from 'expo-router';
import { Platform } from 'react-native';
import { Colors } from '../../src/theme/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === 'web' ? 'none' : 'slide_from_right',
        contentStyle: { backgroundColor: Colors.background },
      }}
    />
  );
}
