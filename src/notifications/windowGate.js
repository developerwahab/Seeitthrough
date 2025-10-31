// // src/notifications/windowGate.js
// import { AppState } from "react-native";
// import { scheduleTaskAlarms, cancelTaskNotifications } from "./scheduler";
// import { loadTasks } from "../storage/tasks";

// const _timers = new Map(); // taskId -> {startTO, endTO}

// /** minutes since midnight (local) */
// const nowMins = () => {
//   const d = new Date();
//   return d.getHours() * 60 + d.getMinutes();
// };

// const inWindow = (m, startM, endM) => m >= startM && m < endM;

// /** clear timers for one task */
// function _clearTimers(taskId) {
//   const t = _timers.get(taskId);
//   if (t?.startTO) clearTimeout(t.startTO);
//   if (t?.endTO) clearTimeout(t.endTO);
//   _timers.delete(taskId);
// }

// /** schedule start/end actions for a task using ONLY the two allowed functions */
// export async function enforceWindowForTask(task) {
//   const id = String(task?.id ?? task?.taskId);
//   if (!id) return;

//   const startM = typeof task.windowStartMins === "number" ? task.windowStartMins : 9 * 60;
//   const endM   = typeof task.windowEndMins   === "number" ? task.windowEndMins   : 20 * 60;

//   _clearTimers(id);

//   const now = new Date();
//   const mNow = nowMins();

//   // Build today’s start/end Date objects
//   const mk = (h, m) => new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m, 0, 0);
//   const S = mk(Math.floor(startM / 60), startM % 60);
//   const E = mk(Math.floor(endM   / 60), endM   % 60);

//   // If end has already passed today, push both to tomorrow
//   let startAt = S, endAt = E;
//   if (now >= E) {
//     startAt = new Date(S.getTime() + 24 * 60 * 60 * 1000);
//     endAt   = new Date(E.getTime() + 24 * 60 * 60 * 1000);
//   }

//   // Action: what to do now
//   if (inWindow(mNow, startM, endM)) {
//     // inside window -> notifications should be ON
//     await cancelTaskNotifications(id);                // ensure clean
//     await scheduleTaskAlarms({
//       taskId: id,
//       title: task.title,
//       why: task.why,
//       intensity: String(task.intensity || "MEDIUM").toUpperCase(),
//       tone: task.tone,
//     });
//   } else {
//     // outside window -> notifications should be OFF
//     await cancelTaskNotifications(id);
//   }

//   // Set timers for next start & end (JS timers; run when app is alive)
//   const msTo = (t) => Math.max(1000, t.getTime() - Date.now());

//   const startTO = setTimeout(async () => {
//     await cancelTaskNotifications(id);
//     await scheduleTaskAlarms({
//       taskId: id,
//       title: task.title,
//       why: task.why,
//       intensity: String(task.intensity || "MEDIUM").toUpperCase(),
//       tone: task.tone,
//     });
//   }, msTo(startAt));

//   const endTO = setTimeout(async () => {
//     await cancelTaskNotifications(id);
//   }, msTo(endAt));

//   _timers.set(id, { startTO, endTO });
// }

// /** call this on app start / foreground to re-apply windows for all active tasks */
// export async function enforceWindowForAllActive() {
//   try {
//     const tasks = await loadTasks();
//     for (const t of (tasks || [])) {
//       if (!t.done) await enforceWindowForTask(t);
//     }
//   } catch {}
// }

// /** set up a simple AppState listener to re-enforce when app becomes active */
// let _appStateSub = null;
// export function attachWindowEnforcer() {
//   if (_appStateSub) return;
//   _appStateSub = AppState.addEventListener("change", async (st) => {
//     if (st === "active") {
//       await enforceWindowForAllActive();
//     }
//   });
// }


// src/notifications/windowGate.js — SERVER ONLY (neutralized)
export async function enforceWindowForTask(/* task */) { /* noop */ }
export async function enforceWindowForAllActive() { /* noop */ }
export function attachWindowEnforcer() { /* noop (no AppState listener) */ }
