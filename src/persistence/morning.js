// src/persistence/morning.js
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';

const ASKED_KEY = "sit/morning/askedDate";
const SKIP_KEY = "sit/morning/skipDate";

export const ymdLocal = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};
 
export async function shouldAskToday() {
  try {
    const today = ymdLocal();
    const asked = await AsyncStorage.getItem(ASKED_KEY);
    return asked !== today; 
  } catch {
    return true;
  }
}

export async function markAskedToday() {
  try {
    await AsyncStorage.setItem(ASKED_KEY, ymdLocal());
  } catch {}
}
 
export async function skipToday() {
  try {
    await AsyncStorage.setItem(SKIP_KEY, ymdLocal());
  } catch {}
}

export async function isTodaySkipped() {
  try {
    const v = await AsyncStorage.getItem(SKIP_KEY);
    return v === ymdLocal();
  } catch {
    return false;
  }
}
