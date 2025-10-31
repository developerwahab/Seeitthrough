// // src/push/getFcmToken.js
// import messaging from '@react-native-firebase/messaging';

// export async function getFcmToken() {
//   // Ask permission (Android 13+ / iOS)
//   try { await messaging().requestPermission(); } catch (e) {}
//   const tok = await messaging().getToken();
//   if (!tok) throw new Error("FCM token is null");

//   // Guard against Expo push token by mistake
//   if (tok.startsWith("ExponentPushToken[")) {
//     throw new Error("Got Expo push token; need real FCM token from @react-native-firebase/messaging");
//   }
//   return tok;
// }




// src/push/getFcmToken.js
import { Platform, PermissionsAndroid } from "react-native";
import messaging from "@react-native-firebase/messaging";
import * as Notifications from "expo-notifications";
 
export async function getFcmTokenRobust({
  timeoutMs = 30000,
  pollEvery = 800,
} = {}) { 
  try {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
  } catch (e) {
    // ignore
  }
 
  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch (e) {
    console.log("[FCM] registerDeviceForRemoteMessages error:", e?.message);
  }
  try {
    await messaging().setAutoInitEnabled?.(true);
  } catch (e) {
    // ignore
  }

  const start = Date.now();
  let tries = 0;
  let lastErr = null;

  while (Date.now() - start < timeoutMs) {
    try { 
      const force = tries % 3 === 1;
      const t = await messaging().getToken(force);
      if (t) {
        console.log("[FCM] messaging.getToken -> got token"); 
        if (t.startsWith("ExponentPushToken[")) {
          console.log("[FCM] got Expo token via messaging (!) — ignoring");
        } else {
          return t;
        }
      }
    } catch (e) {
      lastErr = e;
      console.log("[FCM] messaging.getToken err:", e?.message || e);
    }

    // wait
    await new Promise((r) => setTimeout(r, pollEvery));
    tries++;
  }

  console.log("[FCM] messaging.getToken -> timed out; lastErr:", lastErr);
 
  try {
    const res = await Notifications.getDevicePushTokenAsync({
      provider: "FCM",
    });
    console.log("[FCM] Expo getDevicePushTokenAsync ->", res?.type, res?.data);
    if (res?.type === "fcm" && res?.data) return res.data;
  } catch (e) {
    console.log("[FCM] Expo getDevicePushTokenAsync error:", e?.message);
  }

  return null;
}
