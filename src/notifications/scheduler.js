// src/notifications/scheduler.js  — SERVER ONLY (drop-in)
import * as Notifications from "expo-notifications";

export const __VER = "SERVER_ONLY_2025-09-13";
const SERVER_ONLY = true;
  
export async function scheduleTaskViaServer({ device_id, fcm_token, task }) { 
  const now = Date.now();
  const last = global.__lastServerShotAt || 0;
  const MIN_GAP_MS = 5 * 60 * 1000; 
  const jitter = Math.floor(Math.random() * 30) * 1000; 
  const wait = Math.max(0, (last + MIN_GAP_MS) - now) + jitter;
 
  const step = { AGGRESSIVE: 30*60, MEDIUM: 3*60*60, MILD: 12*60*60 }[(task.intensity||"MILD").toUpperCase()] || (12*60*60);
 
  const firstDelaySec = Math.max(15, Math.floor(wait/1000));

  await api.enqueue({
    fcm_token,
    title: task.title || "Reminder",
    body: task.why || "",
    delaySec: firstDelaySec,  
    device_id,
    task_id: task.id,
    android_channel_id: task.channel || "sit_blunt",
  });

  global.__lastServerShotAt = now + firstDelaySec * 1000;
  return { ok: true, scheduled_in_sec: firstDelaySec, step_sec: step };
}

export async function scheduleTask(taskCtx) {
  if (SERVER_ONLY) {
    return scheduleTaskViaServer(taskCtx);
  } 
}

export async function scheduleTaskAlarms(/* task */) { /* noop */ }
 
export async function cancelTaskSchedule(taskId) { return cancelTaskNotifications(taskId); }
 
export async function cancelTaskNotifications(taskId) {
  try {
    if (!taskId) { 
      await Notifications.cancelAllScheduledNotificationsAsync();
      return;
    }
    const all = await Notifications.getAllScheduledNotificationsAsync();
    const mine = (all || []).filter(n => String(n?.content?.data?.taskId || "") === String(taskId));
    for (const n of mine) {
      if (n?.identifier) await Notifications.cancelScheduledNotificationAsync(n.identifier);
    }
  } catch {}
}
 
export async function listMine() { return []; }
export async function rescheduleAll() { /* noop */ }
export async function ensureAllChannels() { /* noop */ }



























