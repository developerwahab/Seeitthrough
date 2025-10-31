// src/storage/tasks.js
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';

const TASKS_KEY = "sit/tasks/v1";
const SETTINGS_KEY = "sit/settings/v1";
const NOTIF_KEY_PREFIX = "sit/notif-ids/";
const STATS_KEY = "sit/stats/v1";

export async function loadTasks() {
  try {
    const j = await AsyncStorage.getItem(TASKS_KEY);
    return j ? JSON.parse(j) : [];
  } catch {
    return [];
  }
}
export async function saveTasks(tasks) {
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
       return tasks || [];
   } catch {
     return tasks || [];
   }
}

export function defaultSettings() {
  return {
    defaultIntensity: "MEDIUM", 
    windowStartMins: 9 * 60,
    windowEndMins: 20 * 60,
    windowStart: "09:00",
    windowEnd: "20:00",
    reminderWindow: { start: { h: 9, m: 0 }, end: { h: 20, m: 0 } },

    calendarAware: true,
    tone: "BLUNT",
    defaultTone: "BLUNT",
    keepAliveForeground: false,
  };
}
export async function loadSettings() {
  try {
    const j = await AsyncStorage.getItem(SETTINGS_KEY);
    return j ? JSON.parse(j) : defaultSettings();
  } catch {
    return defaultSettings();
  }
}
export async function saveSettings(settings) {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}
 
export async function addNotifId(taskId, id) {
  try {
    const key = NOTIF_KEY_PREFIX + String(taskId);
    const cur = JSON.parse((await AsyncStorage.getItem(key)) || "[]");
    cur.push(id);
    await AsyncStorage.setItem(key, JSON.stringify(cur));
  } catch {}
}
export async function popAllNotifIds(taskId) {
  try {
    const key = NOTIF_KEY_PREFIX + String(taskId);
    const cur = JSON.parse((await AsyncStorage.getItem(key)) || "[]");
    await AsyncStorage.removeItem(key);
    return cur;
  } catch {
    return [];
  }
}
 
export async function getStats() {
  try {
    const j = await AsyncStorage.getItem(STATS_KEY);
    return j
      ? JSON.parse(j)
      : { streak: 0, lastCompleteISO: null, completedTotal: 0 };
  } catch {
    return { streak: 0, lastCompleteISO: null, completedTotal: 0 };
  }
}
export async function bumpStreak() {
  const stats = await getStats();
  const today = new Date().toDateString();
  const last = stats.lastCompleteISO
    ? new Date(stats.lastCompleteISO).toDateString()
    : null;
  if (last === today) {
    stats.completedTotal += 1; 
  } else {
    stats.streak += 1;
    stats.lastCompleteISO = new Date().toISOString();
    stats.completedTotal += 1;
  }
  await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  return stats;
}

export async function markTaskCompleted(taskId) {
  const tasks = await loadTasks();
  const idx = tasks.findIndex((t) => String(t.id) === String(taskId));
  if (idx !== -1) {
    tasks[idx] = {
      ...tasks[idx],
      completedAt: new Date().toISOString(),
      done: true,
    };
    await saveTasks(tasks);
    await bumpStreak();
  }
}

export function newTask(attrs) {
  const now = new Date().toISOString();
  const id = String(attrs.id ?? Math.random().toString(36).slice(2));
     const wsM = typeof attrs.windowStartMins === "number" ? attrs.windowStartMins : 9 * 60;
   const weM = typeof attrs.windowEndMins === "number" ? attrs.windowEndMins : 20 * 60;
   const wsObj = { h: Math.floor(wsM / 60), m: wsM % 60 };
   const weObj = { h: Math.floor(weM / 60), m: weM % 60 };
   const pad2 = (n) => String(n).padStart(2, "0");
   const wsStr = `${pad2(wsObj.h)}:${pad2(wsObj.m)}`;
   const weStr = `${pad2(weObj.h)}:${pad2(weObj.m)}`;
  return {
    id,
    title: attrs.title?.trim() || "",
    why: attrs.why?.trim() || "",
    intensity: attrs.intensity || "MEDIUM",
    windowStartMins: attrs.windowStartMins ?? 9 * 60,
    windowEndMins: attrs.windowEndMins ?? 20 * 60,
       windowStartMins: wsM,
   windowEndMins: weM,
   windowStart: wsObj,
   windowEnd: weObj,
   windowStartStr: wsStr,
   windowEndStr: weStr, 
   ...(attrs.windowStart && typeof attrs.windowStart === "object" ? { windowStart: attrs.windowStart } : {}),
   ...(attrs.windowEnd && typeof attrs.windowEnd === "object" ? { windowEnd: attrs.windowEnd } : {}),
   ...(typeof attrs.windowStartStr === "string" ? { windowStartStr: attrs.windowStartStr } : {}),
   ...(typeof attrs.windowEndStr === "string" ? { windowEndStr: attrs.windowEndStr } : {}),
    calendarAware: !!attrs.calendarAware,
    tone: attrs.tone || "BLUNT",
         cat: attrs.cat || attrs.category || "PRIORITY",
     dueDate: attrs.dueDate || null,
    createdAt: now,
    completedAt: null,
    done: false,
    streak: 0,
  };
}
 
export async function completeTaskById(taskId) {
  const tasks = await loadTasks();
  const i = tasks.findIndex(t => t.id === taskId);
  if (i >= 0) {
    tasks[i].done = true;
    await saveTasks(tasks);
    return true;
  }
  return false;
}



