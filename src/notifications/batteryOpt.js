// src/notifications/batteryOpt.js
import { Platform, Linking } from "react-native";
import * as IntentLauncher from "expo-intent-launcher";

export async function requestIgnoreBatteryOptimizations() {
  if (Platform.OS !== "android") return { ok: false, reason: "ios" };
  try { 
    await IntentLauncher.startActivityAsync(
      IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
    );
    return { ok: true, opened: true };
  } catch (e) { 
    try { await Linking.openSettings(); } catch {}
    return { ok: false, error: String(e) };
  }
}
