import { NativeModules, Platform } from "react-native";
const { AlarmBridge } = NativeModules;
const { SITAlarm } = NativeModules;

export async function scheduleExactAlarm({ taskId, title, body, stepSec,
  startMins = 9*60, endMins = 20*60, firstAt = null }) {
  if (Platform.OS !== "android") return;
  return AlarmBridge.scheduleExact({ taskId, title, body, stepSec, startMins, endMins, firstAt });
}
export async function cancelExactAlarm(taskId) {
  if (Platform.OS !== "android") return;
  return AlarmBridge.cancelExact(String(taskId));
}
export async function scheduleChainedExactAlarm({ taskId, title, body, stepSec, toneKey, channelId }) {
  if (Platform.OS !== "android" || !SITAlarm) return;
  await SITAlarm.scheduleNextExact({
    taskId, title, body, stepSec, toneKey, channelId
  });
}