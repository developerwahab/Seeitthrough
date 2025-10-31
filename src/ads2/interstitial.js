import { Platform, AppState } from "react-native";
import { onProChange } from "../pro/store";
import { ANDROID_INTERSTITIAL, IOS_INTERSTITIAL } from "./config";

let AdMobInterstitial, setTestDeviceIDAsync;
let ready = false;
let isPro = false;
let appOpens = 0;

try {
  const mod = require("expo-ads-admob");
  AdMobInterstitial = mod.AdMobInterstitial;
  setTestDeviceIDAsync = mod.setTestDeviceIDAsync;
} catch { 
}

export async function initInterstitial() {
  if (!AdMobInterstitial) return;
  try {
    await setTestDeviceIDAsync("EMULATOR");
  } catch {}
  const unitId = Platform.OS === "ios" ? IOS_INTERSTITIAL : ANDROID_INTERSTITIAL;
  AdMobInterstitial.setAdUnitID(unitId);
  AdMobInterstitial.addEventListener("interstitialDidClose", async () => {
    ready = false;
    try { await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true }); ready = true; } catch {}
  });
  try {
    await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true });
    ready = true;
  } catch {} 
  onProChange((p) => { isPro = !!p; });
}

export async function onAppOpenForInterstitial() {
  if (!AdMobInterstitial || isPro) return;
  appOpens += 1;
  if (appOpens % 3 !== 0) return; 
  if (!ready) {
    try { await AdMobInterstitial.requestAdAsync({ servePersonalizedAds: true }); ready = true; } catch {}
  }
  try { if (ready) await AdMobInterstitial.showAdAsync(); } catch {}
}
