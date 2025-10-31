// src/push/api.js  — client-safe (no admin key)
const BASE = "https://varsitymessaging.com/api";

async function asJson(res) {
  const txt = await res.text();
  try { return JSON.parse(txt) } catch { throw new Error(txt) }
}

export async function registerDevice({ device_id, fcm_token, tz }) {
  const r = await fetch(`${BASE}/register_device.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ device_id, fcm_token, tz: tz || "UTC" }),
  });
  return asJson(r);
}

export async function createOrUpdateTask(body) { 
  const r = await fetch(`${BASE}/task_create.php`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  return asJson(r);
}
export async function toggleTaskDoneOnServer({ deviceId, taskId, done }) {
  const r = await fetch("https://varsitymessaging.com/api/task_toggle.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      device_id: deviceId,
      task_id: taskId,
      done: done ? 1 : 0,
    }),
  });
  const txt = await r.text();
  let res;
  try {
    res = JSON.parse(txt);
  } catch {
    throw new Error(txt);
  }
  if (!res?.ok) throw new Error(res?.error || "toggle failed");
  return res;
}
