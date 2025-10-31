import mobileAds, {
  BannerAd,
  BannerAdSize,
  InterstitialAd,
  AdEventType,
  TestIds,
} from "react-native-google-mobile-ads";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AppState } from "react-native";

// ==== PRO gating (adjust to your app) ====
import { getIsPro } from "../pro/iap"; // return true/false

// ---- IDs ----
// Use test IDs in dev; replace with your real Ad Unit IDs for prod.
const BANNER_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-7665935090660965/2620192118"; // <- your Banner Ad Unit ID

const INTERSTITIAL_UNIT_ID = __DEV__
  ? TestIds.INTERSTITIAL
  : "ca-app-pub-7665935090660965/7417562533"; // <- optional interstitial

// ---- Light frequency for interstitials (optional) ----
const KEY_OPEN_COUNT = "ads:openCount";
const KEY_LAST_INTER_AT = "ads:lastInterTs";
const KEY_LAST_BG_TS = "ads:lastBgTs"; 
const SHOW_EVERY_NTH_OPEN = 5;       // show on every 5th open
const INTERVAL_MIN_SEC = 2 * 60 * 60; // min 2 hours gap
const MIN_APP_AGE_SEC = 10;
const RESUME_SUPPRESS_MS = 5000;           // not in first 10s

let interstitial = null;
let interReady = false;
let appStartTs = Date.now();

  let _appState = AppState.currentState;
  
  // Record background time from here (do not rely on other files)
  AppState.addEventListener("change", async (next) => {
    _appState = next;
    if (next === "background" || next === "inactive") {
      try { await AsyncStorage.setItem(KEY_LAST_BG_TS, String(Date.now())); } catch {}
    }
  });


export async function initAds() {
  await mobileAds().initialize();
  // Preload interstitial (optional)
  prepareInterstitial();
}

function prepareInterstitial() {
  if (interstitial) {
    interstitial.removeAllListeners?.();
    interstitial = null;
  }
  interstitial = InterstitialAd.createForAdRequest(INTERSTITIAL_UNIT_ID, {
    requestNonPersonalizedAdsOnly: false,
  });
  interReady = false;
  interstitial.addAdEventListener(AdEventType.LOADED, () => (interReady = true));
  interstitial.addAdEventListener(AdEventType.CLOSED, () => {
    interReady = false;
    // load next
    prepareInterstitial();
  });
  interstitial.load();
}

// Call this on app open or screen visits (optional)
export async function maybeShowInterstitial() {
  if (await getIsPro()) return; // Pro => never show ads
  // --- NEW: suppress if we just resumed from background ---
  try {
    const lastBgStr = await AsyncStorage.getItem(KEY_LAST_BG_TS);
    const lastBg = lastBgStr ? parseInt(lastBgStr, 10) : 0;
    const justResumed = lastBg > 0 && (Date.now() - lastBg) < RESUME_SUPPRESS_MS;
    if (justResumed) {
      // Do not increment openCount, and do not show
      return;
    }
  } catch {}


  // spacing + app age checks
  const ageOk = (Date.now() - appStartTs) / 1000 >= MIN_APP_AGE_SEC;
  if (!ageOk) return;

  const cnt = parseInt((await AsyncStorage.getItem(KEY_OPEN_COUNT)) || "0", 10) + 1;
  await AsyncStorage.setItem(KEY_OPEN_COUNT, String(cnt));

  if (cnt % SHOW_EVERY_NTH_OPEN !== 0) return;

  const lastAt = parseInt((await AsyncStorage.getItem(KEY_LAST_INTER_AT)) || "0", 10);
  const since = (Date.now() - lastAt) / 1000;
  if (since < INTERVAL_MIN_SEC) return;

  if (interReady) {
    interstitial.show();
    await AsyncStorage.setItem(KEY_LAST_INTER_AT, String(Date.now()));
  } else {
    // not ready, preload for next time
    prepareInterstitial();
  }
}

// Simple Banner component (auto-hides for Pro)
export function Banner({ style }) {
  const React = require("react");
  const [pro, setPro] = React.useState(true);

  React.useEffect(() => {
    (async () => setPro(await getIsPro()))();
  }, []);

  if (pro) return null;

  return (
    <BannerAd
      unitId={BANNER_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      style={style}
    />
  );
}















// No-Ads build: safe stubs so the app compiles without the Google Mobile Ads SDK

// If later you turn ads back on, restore the old file.

// export async function initAds() {
//   // Nothing to initialize in no-ads mode
//   return;
// }

// export async function maybeShowInterstitial() {
//   // Do nothing
//   return;
// }

// export function Banner(/* { style } */) {
//   // Render nothing in no-ads mode
//   return null;
// }

// // Optional: keep the same named exports if any code reads them
// export const BANNER_UNIT_ID = null;
// export const INTERSTITIAL_UNIT_ID = null;
