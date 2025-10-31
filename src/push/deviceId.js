// src/push/deviceId.js
import * as Application from "expo-application";
import AsyncStorage from "../utils/safeAsyncStorage";
import { Platform } from "react-native";

const DID_KEY = "sit/deviceId";

function djb2(str) {
  let h = 5381;
  for (let i = 0; i < str.length; i++) h = (h * 33) ^ str.charCodeAt(i);
  return h >>> 0;
}
function toHex32(n) {
  return ("00000000" + n.toString(16)).slice(-8);
}
function shortHash(s) { 
  const a = djb2(s);
  const b = djb2(s.split("").reverse().join(""));
  return toHex32(a) + toHex32(b);
}

export async function getStableDeviceId() { 
  const saved = await AsyncStorage.getItem(DID_KEY);
  if (saved) return saved;
 
  let base = "";
  if (Platform.OS === "android") {
    try { base = await Application.getAndroidIdAsync(); } catch {}
  }
 
  if (!base || String(base).toLowerCase() === "undefined") {
    base = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2,10)}`;
  }

  const id = `sit-${shortHash(String(base))}`;  
  await AsyncStorage.setItem(DID_KEY, id);
  return id;
}
