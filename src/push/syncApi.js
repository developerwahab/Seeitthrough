// src/push/syncApi.js
import { API_BASE, API_KEY } from '../config/server';
import { api } from "./api";
import { ensureDeviceIdentity } from "./registerFCM";
import { scheduleTask } from "../notifications/scheduler"; 

async function post(path, body) {
  const r = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  try { return await r.json(); } catch { return {}; }
}

export async function syncDeviceAndToken({ deviceId, fcmtoken, tz }) {
  return api.registerDevice({ device_id: deviceId, fcm_token: fcmtoken, tz });
}

export async function syncTasksToServer(allTasks) {
  const { device_id } = await ensureDeviceIdentity(); 
  await api.syncTasks({ device_id, tasks: allTasks });
  return true;
}

async function onTaskSaved(task) {
  const { device_id, fcm_token } = await ensureDeviceIdentity();
  await scheduleTask({ device_id, fcm_token, task });
}