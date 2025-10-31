// src/boot/refreshAll.js 
import { Platform, PermissionsAndroid } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import messaging from "@react-native-firebase/messaging";
import notifee, { AndroidImportance } from "@notifee/react-native";
import * as Device from "expo-device";
 
let _emit = () => {};
try {
  const maybeBus = require("../events/bus");
  if (maybeBus?.emit) _emit = maybeBus.emit;
} catch {}
 
const uuid32 = () => "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () =>
  Math.floor(Math.random() * 16).toString(16)
);

async function ensureNotifPermission() {
  try {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
    await Notifications.requestPermissionsAsync();
  } catch {}
}

async function ensureAllChannels() {
  if (Platform.OS !== "android") return;
  try {
    const bases = ["blunt", "supportive", "spouse", "drill"];
    const ids = [];
    for (const b of bases) for (let i = 1; i <= 5; i++) ids.push(`${b}_${i}`);

    for (const id of ids) {
      await notifee.createChannel({
        id,
        name: id.replace("_", " ").toUpperCase(),
        importance: AndroidImportance.HIGH,
        sound: id,
        vibration: true,
      });
    }
    await notifee.createChannel({
      id: "sit_blunt",
      name: "Reminders",
      importance: AndroidImportance.HIGH,
      sound: "default",
      vibration: true,
    });
  } catch (e) {
    console.log("[refreshAll] ensureAllChannels error:", e?.message);
  }
}

async function getOrCreateInstallSecret() {
  const KEY = "sit/installSecret";
  let s = (await AsyncStorage.getItem(KEY)) || "";
  if (!s) {
    s = uuid32();
    await AsyncStorage.setItem(KEY, s);
  }
  return s;
}

async function getOrCreateDeviceId() {
  const KEY = "sit/deviceId";
  let did = (await AsyncStorage.getItem(KEY)) || "";
  if (!did) { 
    const seed =
      Device.osInternalBuildId ||
      Device.osBuildId ||
      Device.deviceName ||
      `android-${Date.now()}`;
    did = `sit-${seed}-${Math.floor(Math.random() * 1e6).toString(16)}`;
    await AsyncStorage.setItem(KEY, did);
  }
  return did;
}

async function getFcmTokenRobust() { 
  await ensureNotifPermission();

  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch (e) {
    console.log("[refreshAll] registerDeviceForRemoteMessages:", e?.message);
  }
 
  let lastErr = null;
  for (let i = 0; i < 5; i++) {
    try {
      const t = await messaging().getToken();
      if (t) return t;
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 600));
  }
  if (lastErr) console.log("[refreshAll] getToken error:", lastErr?.message);
 
  try {
    const res = await Notifications.getDevicePushTokenAsync({ provider: "FCM" });
    if (res?.type === "fcm" && res?.data) return res.data;
  } catch (e) {
    console.log("[refreshAll] Expo FCM fallback error:", e?.message);
  }

  return "";
}
 
async function stepEnsureDeviceIdentity() {
  const deviceId = await getOrCreateDeviceId();
  const installSecret = await getOrCreateInstallSecret();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

  let fcmtoken = "";
  try { fcmtoken = await getFcmTokenRobust(); } catch {}
 
  const ST = "sit/register_v1_last";
  let last = {};
  try { last = JSON.parse((await AsyncStorage.getItem(ST)) || "{}"); } catch {}
  const same =
    last?.deviceId === deviceId &&
    last?.fcmtoken === fcmtoken &&
    last?.tz === tz;

  if (!same) {
    try {
      await fetch("https://varsitymessaging.com/api/register_device.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ device_id: deviceId, tz, fcm_token: fcmtoken }),
      });
      await AsyncStorage.setItem(ST, JSON.stringify({ deviceId, fcmtoken, tz }));
    } catch (e) {
      console.log("[refreshAll] register_device failed:", e?.message);
    }
  } else { 
  }

  return { deviceId, installSecret, fcmtoken, tz };
}

async function stepPullServerState() { 
  try { 
    await Promise.race([
      fetch("https://varsitymessaging.com/api/health.php").catch(() => {}),
      new Promise((r) => setTimeout(r, 1000)),
    ]);
  } catch {}
}

async function stepRescheduleNotifications() { 
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
  try {
    await notifee.cancelTriggerNotifications();
  } catch {} 
}

async function stepWarmCaches() { 
  await ensureAllChannels();
}
 
let inFlight = null;
let lastRunAt = 0;
const MIN_GAP_MS = 3000;

function withSoftTimeout(promise, ms, onTimeout) {
  let timedOut = false;
  const t = setTimeout(() => {
    timedOut = true;
    try { onTimeout?.(); } catch {}
  }, ms);
  return promise.finally(() => {
    if (!timedOut) clearTimeout(t);
  });
}
 
export async function refreshAll(reason = "splash") {
  const now = Date.now();
  if (inFlight) return inFlight;
  if (now - lastRunAt < MIN_GAP_MS) return;

  _emit("refresh:start", { reason, at: now });

  inFlight = (async () => {
    try {
      await withSoftTimeout(
        (async () => { 
          await stepEnsureDeviceIdentity(); 
          await Promise.allSettled([
            stepPullServerState(),
            stepRescheduleNotifications(),
            stepWarmCaches(),
          ]);
        })(),
        3500,
        () => _emit("refresh:softTimeout", { reason })
      );
    } catch (e) {
      _emit("refresh:error", { reason, error: String(e) });
    } finally {
      lastRunAt = Date.now();
      _emit("refresh:done", { reason, at: lastRunAt });
      inFlight = null;
    }
  })();

  return inFlight;
}
