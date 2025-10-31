// src/persistence/firstRun.js
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';

const KEY = "sit/boot/v1";

async function read() {
  try {
    const j = await AsyncStorage.getItem(KEY);
    if (j) return JSON.parse(j);
  } catch {}
  return { onboarded: false, started: false, consents: { cookies: null } };
}

async function write(patch) {
  const cur = await read();
  const next = {
    ...cur,
    ...patch,
    consents: { ...(cur.consents || {}), ...((patch && patch.consents) || {}) },
  };
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  } catch {}
  return next;
}

export async function hasCookieConsent() {
  const s = await read();
  return s.consents?.cookies === true;
}
export async function setCookieConsent(v) {
  await write({ consents: { cookies: !!v } });
}

export async function isFirstRunDone() {
  const s = await read();
  return !!(s.onboarded && s.started);
}
export async function markOnboardingDone() {
  await write({ onboarded: true });
}
export async function markGetStartedDone() {
  await write({ started: true });
}
