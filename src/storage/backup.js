// src/storage/backup.js
// import AsyncStorage from "@react-native-async-storage/async-storage";

import AsyncStorage from '../utils/safeAsyncStorage';
let safeParse = (v, fallback) => {
  try {
    return v != null ? JSON.parse(v) : fallback;
  } catch {
    return fallback;
  }
};

const KEYS = {
  tasks: "tasks",
  settings: "settings",
  streak: "streak",
  notifIds: "notifIds", 
  tones: "tones",
};

export async function loadAllData() {
  const pairs = await AsyncStorage.multiGet(Object.values(KEYS));
  const map = Object.fromEntries(pairs);
  return {
    tasks: safeParse(map[KEYS.tasks], []),
    settings: safeParse(map[KEYS.settings], {}),
    streak: safeParse(map[KEYS.streak], 0),
    notifIds: safeParse(map[KEYS.notifIds], []),
    tones: safeParse(map[KEYS.tones], null),
  };
}

export async function restoreAllData(payload) {
  const toSet = [];
  if ("tasks" in payload)
    toSet.push([KEYS.tasks, JSON.stringify(payload.tasks)]);
  if ("settings" in payload)
    toSet.push([KEYS.settings, JSON.stringify(payload.settings)]);
  if ("streak" in payload)
    toSet.push([KEYS.streak, JSON.stringify(payload.streak)]);
  if ("notifIds" in payload)
    toSet.push([KEYS.notifIds, JSON.stringify(payload.notifIds)]);
  if ("tones" in payload)
    toSet.push([KEYS.tones, JSON.stringify(payload.tones)]);
  if (toSet.length) await AsyncStorage.multiSet(toSet);
}
