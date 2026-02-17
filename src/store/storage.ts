import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  TRAINING_PLAN: 'marathon_training_plan',
  USER_PROFILE: 'marathon_user_profile',
  ONBOARDING_COMPLETE: 'marathon_onboarding_complete',
};

export async function savePlan(plan: any): Promise<void> {
  await AsyncStorage.setItem(KEYS.TRAINING_PLAN, JSON.stringify(plan));
}

export async function loadPlan(): Promise<any | null> {
  const data = await AsyncStorage.getItem(KEYS.TRAINING_PLAN);
  return data ? JSON.parse(data) : null;
}

export async function saveProfile(profile: any): Promise<void> {
  await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
}

export async function loadProfile(): Promise<any | null> {
  const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
  return data ? JSON.parse(data) : null;
}

export async function setOnboardingComplete(complete: boolean): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
}

export async function isOnboardingComplete(): Promise<boolean> {
  const data = await AsyncStorage.getItem(KEYS.ONBOARDING_COMPLETE);
  return data ? JSON.parse(data) : false;
}

export async function clearAll(): Promise<void> {
  await AsyncStorage.multiRemove([
    KEYS.TRAINING_PLAN,
    KEYS.USER_PROFILE,
    KEYS.ONBOARDING_COMPLETE,
  ]);
}
