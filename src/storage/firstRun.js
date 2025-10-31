import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY_DONE = 'sit_has_completed_onboarding_v1';

export async function hasCompletedOnboarding() {
  try {
    const v = await AsyncStorage.getItem(KEY_DONE);
    return v === 'true';
  } catch {
    return false;
  }
}

export async function setCompletedOnboarding() {
  try {
    await AsyncStorage.setItem(KEY_DONE, 'true');
  } catch {}
} 