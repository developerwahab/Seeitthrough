// src/utils/skipSplash.js
import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "sit/skipSplashOnce";

export async function setSkipSplashOnce() {
  try { await AsyncStorage.setItem(KEY, "1"); } catch {}
}

export async function consumeSkipSplashOnce() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    if (v === "1") {
      await AsyncStorage.removeItem(KEY);
      return true;
    }
  } catch {}
  return false;
}
 