// src/push/fcmToken.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform } from "react-native";

export async function getRealFcmToken() {
  if (!Device.isDevice) throw new Error("Not a physical device");
  const { status } = await Notifications.requestPermissionsAsync();
  if (status !== "granted") throw new Error("Notification permission denied");
 
  const provider = Platform.select({ android: "FCM", default: undefined });
  const tok = await Notifications.getDevicePushTokenAsync({ provider });
  const token = tok?.data || "";

  if (!token) throw new Error("FCM token empty");
  if (token.startsWith("ExponentPushToken[")) {
    throw new Error("Got Expo push token; install a dev/preview build to get real FCM token");
  }
  return token;
}
