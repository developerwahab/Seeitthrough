// src/ads/interstitial.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState, Alert, Platform } from "react-native";
import { isPro } from "../pro/store";

export const OPEN_COUNT_KEY = "ads:openCount";

// Optional resume-suppression (prevents instant ad on resume)
const LAST_BG_TS_KEY = "ads:lastBgTs";
const RESUME_SUPPRESS_MS = 5000;

let appState = AppState.currentState;
AppState.addEventListener("change", async (next) => {
  appState = next;
  if (next === "background" || next === "inactive") {
    await AsyncStorage.setItem(LAST_BG_TS_KEY, String(Date.now()));
  }
});

/* ---------------------------------------------------
   Interstitial backend (google-mobile-ads if present)
--------------------------------------------------- */
let _mobileAds; // module
let _InterstitialAd; // class
let _AdEventType; // enum
let _TestIds; // test ids
let _ad; // interstitial instance
let _ready = false;
let _inited = false;

// Replace with your real ad unit id in release
const ANDROID_AD_UNIT = __DEV__ ? "ca-app-pub-7665935090660965/7417562533" : "ca-app-pub-xxxxxxxxxxxxxxxx/yyyyyyyyyy";
const IOS_AD_UNIT     = __DEV__ ? "ca-app-pub-3940256099942544/4411468910" : "ca-app-pub-xxxxxxxxxxxxxxxx/zzzzzzzzzz";
const AD_UNIT_ID = Platform.OS === "ios" ? IOS_AD_UNIT : ANDROID_AD_UNIT;

// Try to require google-mobile-ads lazily so app won’t crash if not installed
function tryWireGoogleMobileAds() {
  try {
    // eslint-disable-next-line global-require
    _mobileAds = require("react-native-google-mobile-ads");
    _InterstitialAd = _mobileAds.InterstitialAd;
    _AdEventType = _mobileAds.AdEventType;
    _TestIds = _mobileAds.TestIds;
    return true;
  } catch {
    return false;
  }
}

function createAndLoad() {
  if (!_InterstitialAd) return;
  _ready = false;
  _ad = _InterstitialAd.createForAdRequest(AD_UNIT_ID, {
    requestNonPersonalizedAdsOnly: true,
    keywords: ["productivity", "tasks", "work"],
  });
  _ad.addAdEventListener(_AdEventType.LOADED, () => { _ready = true; });
  _ad.addAdEventListener(_AdEventType.CLOSED, () => {
    _ready = false;
    // Preload the next one automatically after close
    setTimeout(() => { try { _ad.load(); } catch {} }, 300);
  });
  _ad.addAdEventListener(_AdEventType.ERROR, () => { _ready = false; });
  try { _ad.load(); } catch {}
}

export async function initInterstitial() {
  if (_inited) return;
  _inited = true;

  const hasSDK = tryWireGoogleMobileAds();
  if (hasSDK) {
    // Initialize SDK (safe if already initted elsewhere)
    try { await _mobileAds.default().initialize(); } catch {}
    createAndLoad();
  }
}

// Show using SDK if available; otherwise show a dev Alert as a fallback
async function showNow() {
  // If google-mobile-ads is wired and ad is ready, show it
  if (_ad && _ready) {
    try {
      _ad.show();
      _ready = false;
      return true;
    } catch {
      // ignore and fall through to fallback
    }
  }

  // Fallback — only in DEV
  // if (__DEV__) {
  //   Alert.alert("Interstitial (DEV)", "This simulates an interstitial.", [{ text: "OK" }]);
  //   return true;
  // }

  // return false; // in production, no alert
}

/* ---------------------------------------------------
   Counter + policy
--------------------------------------------------- */
export async function onAppOpenForInterstitial({ enabled = true } = {}) {
  if (!enabled) return { shown: false, count: null };
  if (typeof isPro === "function" && isPro()) return { shown: false, count: null };

  // Resume suppression (optional)
  const lastBgTsStr = await AsyncStorage.getItem(LAST_BG_TS_KEY);
  const lastBgTs = lastBgTsStr ? parseInt(lastBgTsStr, 10) : 0;
  if (lastBgTs > 0 && Date.now() - lastBgTs < RESUME_SUPPRESS_MS) {
    return { shown: false, count: null };
  }

  // Increment open counter
  const raw = await AsyncStorage.getItem(OPEN_COUNT_KEY);
  let n = parseInt(raw || "0", 10);
  if (isNaN(n)) n = 0;
  n += 1;
  await AsyncStorage.setItem(OPEN_COUNT_KEY, String(n));

  // Every 3rd open
  if (n % 3 !== 0) return { shown: false, count: n };

  // Make sure we tried to init/load
  await initInterstitial();

  // Attempt to show
  const ok = await showNow();
  // Preload next one if we used fallback or failed SDK
  if (!_ad || !_ready) setTimeout(() => { try { createAndLoad(); } catch {} }, 300);
  return { shown: ok, count: n };
}

export async function resetInterstitialCounter() {
  await AsyncStorage.setItem(OPEN_COUNT_KEY, "0");
}















// No-ads build: interstitial stubs

// export async function initInterstitial() {
//   // nothing to init
//   return;
// }

// export async function onAppOpenForInterstitial() { 
//   return { shown: false, count: null };
// }

// export async function resetInterstitialCounter() { 
//   return;
// }
