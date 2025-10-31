// src/notifications/actions.js
import * as Notifications from "expo-notifications";
import { cancelTaskNotifications } from "./scheduler";
import { markTaskCompleted } from "../storage/tasks";
import { emit } from "../events/bus";

const IN_FLIGHT = new Set();
let _bound = false;

export function initActionHandlers() {
  if (_bound) return;
  _bound = true;
 
  Notifications.addNotificationResponseReceivedListener(handleAction);
 
  Notifications.getLastNotificationResponseAsync()
    .then((resp) => {
      if (resp) handleAction(resp);
    })
    .catch(() => {});
}

async function handleAction(response) {
  try {
    const actionId = response?.actionIdentifier;
    const req = response?.notification?.request;
    const notifId = req?.identifier;
    const data = req?.content?.data || {};
    const taskId = String(data?.taskId || "");

    if (!taskId) return;
 
    if (IN_FLIGHT.has(taskId)) return;
    IN_FLIGHT.add(taskId);
 
    if (notifId) {
      try { await Notifications.dismissNotificationAsync(notifId); } catch {}
    }

    if (actionId === "mark_done") { 
      await markTaskCompleted(taskId);
 
      await cancelTaskNotifications(taskId);
 
      try {
        const presented = await Notifications.getPresentedNotificationsAsync();
        const toDismiss = (presented || [])
          .filter((n) => String(n?.request?.content?.data?.taskId || "") === taskId)
          .map((n) => n?.request?.identifier)
          .filter(Boolean);
        for (const id of toDismiss) {
          try { await Notifications.dismissNotificationAsync(id); } catch {}
        }
      } catch {}
 
      try { emit("TASKS_UPDATED", { taskId, done: true }); } catch {}
    }
    else if (actionId === "dismiss_now") { 
      try {
        const presented = await Notifications.getPresentedNotificationsAsync();
        const toDismiss = (presented || [])
          .filter((n) => String(n?.request?.content?.data?.taskId || "") === taskId)
          .map((n) => n?.request?.identifier)
          .filter(Boolean);
        for (const id of toDismiss) {
          try { await Notifications.dismissNotificationAsync(id); } catch {}
        }
      } catch {}
    } else { 
    }
  } catch (e) {
    console.log("[notif action] error", e);
  } finally {
    setTimeout(() => IN_FLIGHT.delete(String(
      response?.notification?.request?.content?.data?.taskId || ""
    )), 250);
  }
}
