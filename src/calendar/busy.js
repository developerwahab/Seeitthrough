// src/calendar/busy.js
import * as Calendar from "expo-calendar";
import { Platform } from "react-native";

let asked = false;
let granted = false;
async function ensurePerm() {
  if (asked) return granted;
  asked = true;
  const p = await Calendar.requestCalendarPermissionsAsync();
  granted = p.status === "granted";
  return granted;
}
 
export async function isBusyInNext(arg1 = 15, arg2) {
  if (Platform.OS !== "android") return false;  
  const ok = await ensurePerm();
  if (!ok) return false;

  const minutes = typeof arg1 === "number" ? arg1 : arg2 ?? 15;
  const base = typeof arg1 === "number" ? new Date() : arg1;
  const end = new Date(base.getTime() + minutes * 60 * 1000);

  const cals = await Calendar.getCalendarsAsync(Calendar.EntityTypes.EVENT);
  for (const c of cals) {
    try {
      const ev = await Calendar.getEventsAsync([c.id], base, end);
      if (ev?.length) return true;
    } catch {}
  }
  return false;
}
