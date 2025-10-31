// src/ads/index.js
import { useEffect, useRef } from "react";
import { AppState } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';

// Interstitial helpers (same module jahan aap counter maintain karte ho)
import {
  initInterstitial,
  onAppOpenForInterstitial as coreOnAppOpenForInterstitial,
} from "./interstitial";

// Pro gate – agar aapke pass payments store hai to uska isPaid() bhi chal sakta hai
import { isPro } from "../pro/store";

// Optional banner component (aapke project me already hai)
import Banner from "./Banner";

/* ---------------------------------
   Resume suppression (5 seconds)
---------------------------------- */
const LAST_BG_TS_KEY = "ads:lastBgTs";
const RESUME_SUPPRESS_MS = 5000;

let _appState = AppState.currentState;
let _listenerInstalled = false;

function ensureAppStateListener() {
  if (_listenerInstalled) return;
  _listenerInstalled = true;
  AppState.addEventListener("change", async (next) => {
    _appState = next;
    if (next === "background" || next === "inactive") {
      try {
        await AsyncStorage.setItem(LAST_BG_TS_KEY, String(Date.now()));
      } catch {}
    }
  });
}

async function shouldSuppressOnResume() {
  try {
    const raw = await AsyncStorage.getItem(LAST_BG_TS_KEY);
    const ts = raw ? parseInt(raw, 10) : 0;
    if (!ts) return false;
    return Date.now() - ts < RESUME_SUPPRESS_MS;
  } catch {
    return false;
  }
}

/* ---------------------------------
   Public: App-open handler (wrapper)
---------------------------------- */
export async function onAppOpenForInterstitial({ enabled = true } = {}) {
  // ads disabled by caller?
  if (!enabled) return { shown: false, count: null };

  // pro users: never show
  try {
    if (isPro && typeof isPro === "function" && isPro()) {
      return { shown: false, count: null };
    }
  } catch {}

  // avoid spam right after resume
  if (await shouldSuppressOnResume()) {
    return { shown: false, count: null };
  }

  // delegate to core (yehi counter + har 3rd open logic handle karta hai)
  return coreOnAppOpenForInterstitial({ enabled: true });
}

/* ---------------------------------
   Hook: auto-trigger on app opens
---------------------------------- */
export function useInterstitialEveryThirdOpen(enabled = true) {
  const firstSkipped = useRef(false);

  useEffect(() => {
    let sub;
    (async () => {
      ensureAppStateListener();
      await initInterstitial();

      // initial open (mount par) — optional but handy
      await onAppOpenForInterstitial({ enabled });

      // subsequent app foregrounds
      sub = AppState.addEventListener("change", async (s) => {
        if (s === "active") {
          // right after mount aane wale pe skip
          if (!firstSkipped.current) {
            firstSkipped.current = true;
            return;
          }
          await onAppOpenForInterstitial({ enabled });
        }
      });
    })();

    return () => sub?.remove?.();
  }, [enabled]);
}

/* ---------------------------------
   Banner wrapper (Pro par hide)
---------------------------------- */
export function AdBanner(props = {}) {
  // explicit prop has precedence; else gate by pro
  const enabledProp = "enabled" in props ? !!props.enabled : true;

  try {
    if (isPro && typeof isPro === "function" && isPro()) return null;
  } catch {}

  if (!enabledProp) return null;

  // aapka Banner component already exist karta hai
  return <Banner {...props} />;
}

/* ---------------------------------
   Legacy named exports (optional)
---------------------------------- */
export const ADS_ENABLED = true; // global toggle if you ever need it

export async function initAds() {
  ensureAppStateListener();
  await initInterstitial();
}

export function loadInterstitial() {
  // if your SDK needs explicit load, call here. Otherwise leave noop.
}

export async function showInterstitial() {
  // if you want a manual show API; your SDK ka show yahan call karein.
}

/* ---------------------------------
   Default aggregate
---------------------------------- */
export default {
  ADS_ENABLED,
  initAds,
  loadInterstitial,
  showInterstitial,
  onAppOpenForInterstitial,
  useInterstitialEveryThirdOpen,
  AdBanner,
};
