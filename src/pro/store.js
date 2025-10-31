// src/pro/store.js
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';

const KEY = "sit/pro/active";
let _pro = false;
const listeners = new Set();

export async function loadProFromStorage() {
  try {
    const v = await AsyncStorage.getItem(KEY);
    _pro = v === "true";
    for (const cb of Array.from(listeners)) cb(_pro);
  } catch {}
  return _pro;
}

export function isPro() {
  return _pro;
}

export async function setPro(v) {
  _pro = !!v;
  try {
    await AsyncStorage.setItem(KEY, _pro ? "true" : "false");
  } catch {}
  for (const cb of Array.from(listeners)) cb(_pro);
  return _pro;
}

export function onProChange(cb) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
