// src/pro/donationBadge.js
import AsyncStorage from '../utils/safeAsyncStorage';

const KEY_LAST = "sit/iap/lastDonationAt";
const KEY_TEXT = "sit/iap/badgeText";
const KEY_CACHE_UNTIL = "sit/iap/badgeCacheUntil";

export const BADGE_TTL_MS = 90 * 24 * 60 * 60 * 1000; 
const PHRASE_BURST_CACHE_MS = 2000;
 
export const DONATION_LABELS = [
  "❤️ Donor",
  "⭐ Supporter",
  "🎉 Donated",
  "❤️ Supporter",
  "✨ App Donor", 
];

function randomFrom(list, exclude) {
  if (!list?.length) return "";
  if (list.length === 1) return list[0];
  let pick = list[Math.floor(Math.random() * list.length)]; 
  if (exclude && list.length > 1) {
    let guard = 0;
    while (pick === exclude && guard < 5) {
      pick = list[Math.floor(Math.random() * list.length)];
      guard++;
    }
  }
  return pick;
}

export async function recordDonation() {
  try {
    await AsyncStorage.setItem(KEY_LAST, String(Date.now())); 
    const picked = randomFrom(DONATION_LABELS);
    await AsyncStorage.setItem(KEY_TEXT, picked); 
    await AsyncStorage.setItem(KEY_CACHE_UNTIL, "0");
  } catch {}
}

export async function hasDonationBadge() {
  try {
    const v = await AsyncStorage.getItem(KEY_LAST);
    const t = Number(v);
    return Number.isFinite(t) && (Date.now() - t) < BADGE_TTL_MS;
  } catch {
    return false;
  }
}

export async function getDonationPhrase() {
  try { 
    const [saved, untilStr] = await Promise.all([
      AsyncStorage.getItem(KEY_TEXT),
      AsyncStorage.getItem(KEY_CACHE_UNTIL),
    ]);
    const until = Number(untilStr);
    const now = Date.now();

    if (saved && Number.isFinite(until) && now < until) {
      return saved; 
    }
 
    const next = randomFrom(DONATION_LABELS, saved || null);

    await Promise.all([
      AsyncStorage.setItem(KEY_TEXT, next),
      AsyncStorage.setItem(KEY_CACHE_UNTIL, String(now + PHRASE_BURST_CACHE_MS)),
    ]);

    return next;
  } catch {
    return DONATION_LABELS[0];
  }
}

export async function clearDonationBadge() {
  try {
    await AsyncStorage.removeItem(KEY_LAST);
    await AsyncStorage.removeItem(KEY_TEXT);
    await AsyncStorage.removeItem(KEY_CACHE_UNTIL);
  } catch {}
}
  