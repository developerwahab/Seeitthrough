// App.js 
import "./src/notifications/notifeeBoot";
import "react-native-gesture-handler";
import "react-native-reanimated";
import firebase from "@react-native-firebase/app";

import React, { useEffect, useRef, useState } from "react";
import {
  AppState,
  StatusBar,
  View,
  ActivityIndicator,
  Platform,
  Text,
  PermissionsAndroid,
} from "react-native";

import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Notifications from "expo-notifications";
import notifee, { AndroidImportance, EventType } from "@notifee/react-native";
import messaging from "@react-native-firebase/messaging";

import { emit } from "./src/events/bus";
 
const { installProOverride, ProTestButton } = require("./src/dev/ProTestKit");
installProOverride(); 
 
import OnboardingScreen from "./screens/OnboardingScreen";
import SplashScreen from "./screens/SplashScreen";
import GetStartedScreen from "./screens/GetStartedScreen";
import AddTaskScreen from "./screens/AddTaskScreen";
import CalendarScreen from "./screens/CalendarScreen";
import AnalysisScreen from "./screens/AnalysisScreen";
import RootNavigator from "./navigation/RootNavigator";
import UnlockProScreen from "./screens/UnlockProScreen";
import PrivacyPolicyScreen from "./screens/PrivacyPolicyScreen";
import AboutScreen from "./screens/AboutScreen";
import DonateScreen from "./screens/DonateScreen"; 
import { refreshAll } from "./src/boot/refreshAll"; 
import {
  cancelTaskNotifications,  
} from "./src/notifications/scheduler";
import { loadProFromStorage } from "./src/pro/store";
import { initIapConnection, restoreProFromPurchases } from "./src/pro/iap";
import { preloadCatalog } from "./src/pro/catalogStore";
import { startReminderService } from "./src/foreground";
import { loadSettings, loadTasks, saveTasks } from "./src/storage/tasks";
import { emitTasksUpdated } from "./src/events/bus";
import { initActionHandlers } from "./src/notifications/actions";
import { consumeSkipSplashOnce } from "./src/utils/skipSplash";
 
import {
  ensureDeviceIdentity,
  refreshPushTokenIfChanged,
} from "./src/push/registerFCM";
import { syncDeviceAndToken, syncTasksToServer } from "./src/push/syncApi";
import { isFirstRunDone } from "./src/persistence/firstRun";
import {
  initInterstitial,
  onAppOpenForInterstitial,
} from "./src/ads/interstitial";
import mobileAds from "react-native-google-mobile-ads";
 
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
 
const FIRST_BOOT_KEY = "sit/firstBootDone";
async function isFirstBoot() {
  const v = await AsyncStorage.getItem(FIRST_BOOT_KEY);
  return !v;
}
async function markFirstBootDone() {
  await AsyncStorage.setItem(FIRST_BOOT_KEY, "1");
}

const Stack = createNativeStackNavigator();

const iapAvailable = Platform.OS !== "web";

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
 
async function getFcmTokenRobust() {
  try {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
  } catch {}

  try {
    await messaging().registerDeviceForRemoteMessages();
  } catch (e) {
    console.log("registerDeviceForRemoteMessages error:", e);
  }

  let lastErr = null;
  for (let i = 0; i < 5; i++) {
    try {
      const t = await messaging().getToken();
      if (t) {
        console.log("[TokenProbe] RNFirebase getToken ->", t ? "yes" : "no");
        return t;
      }
    } catch (e) {
      lastErr = e;
    }
    await new Promise((r) => setTimeout(r, 800));
  }
  if (lastErr) console.log("[TokenProbe] RNFirebase getToken error:", lastErr);

  try {
    const res = await Notifications.getDevicePushTokenAsync({
      provider: "FCM",
    });
    console.log(
      "[TokenProbe] Expo getDevicePushTokenAsync ->",
      res ? "yes" : "no"
    );
    if (res?.type === "fcm" && res?.data) return res.data;
  } catch (e) {
    console.log("[TokenProbe] Expo provider FCM error:", e);
  }

  console.log("[TokenProbe] No token yet (check google-services.json)");
  return "";
}

async function waitForFcmTokenGate({
  minWaitMs = 0,
  pollEvery = 1000,
  timeoutMs = 60000,
} = {}) {
  try {
    await messaging().registerDeviceForRemoteMessages();
    await messaging().setAutoInitEnabled?.(true);
  } catch {}

  const start = Date.now();
  let resolved = false;

  return new Promise(async (resolve) => {
    const finish = (t) => {
      if (resolved) return;
      resolved = true;
      const left = Math.max(0, minWaitMs - (Date.now() - start));
      setTimeout(() => resolve(t || ""), left);
    };

    try {
      const t0 = await messaging().getToken();
      if (t0) return finish(t0);
    } catch {}

    const unsub = messaging().onTokenRefresh((t) => {
      try {
        unsub?.();
      } catch {}
      finish(t);
    });

    (async function poll() {
      while (!resolved && Date.now() - start < timeoutMs) {
        try {
          const t = await messaging().getToken();
          if (t) {
            try {
              unsub?.();
            } catch {}
            return finish(t);
          }
        } catch {}
        await new Promise((r) => setTimeout(r, pollEvery));
      }
      try {
        unsub?.();
      } catch {}
      finish("");  
    })();
  });
}
 
async function fetchFcmTokenFirstRun({
  timeoutMs = 60000,
  pollEvery = 1000,
} = {}) {
  try {
    if (Platform.OS === "android" && Platform.Version >= 33) {
      await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
      );
    }
  } catch {}

  try {
    await messaging().registerDeviceForRemoteMessages();
    await messaging().setAutoInitEnabled?.(true);
  } catch (e) {
    console.log("[FCM] register/setAutoInit error:", e?.message);
  }

  const start = Date.now();
  let resolved = false;

  return await new Promise((resolve) => {
    const finish = (t) => {
      if (resolved) return;
      resolved = true;
      resolve(t || "");
    };

    const unsub = messaging().onTokenRefresh((t) => {
      try {
        unsub?.();
      } catch {}
      console.log("[FCM] onTokenRefresh ->", !!t);
      finish(t);
    });

    let tries = 0;
    (async function poll() {
      while (!resolved && Date.now() - start < timeoutMs) {
        try {
          const force = tries % 3 === 1;  
          const t = await messaging().getToken(force);
          console.log(`[FCM] getToken(force:${force}) ->`, t ? "yes" : "no");
          if (t) {
            try {
              unsub?.();
            } catch {}
            return finish(t);
          }
        } catch (e) {
          console.log("[FCM] getToken error:", e?.message);
        }
        tries++;
        await new Promise((r) => setTimeout(r, pollEvery));
      }
      try {
        unsub?.();
      } catch {}
      finish("");
    })();
  });
}

async function ensureAllChannels() {
  if (Platform.OS !== "android") return;
  const bases = ["blunt", "supportive", "spouse", "drill"];
  const ids = [];
  for (const b of bases) for (let i = 1; i <= 5; i++) ids.push(`${b}_${i}`);
  try {
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
    console.log("ensureAllChannels error:", e?.message);
  }
}

async function getOrCreateInstallSecret() {
  const KEY = "sit/installSecret";
  let s = (await AsyncStorage.getItem(KEY)) || "";
  if (!s) {
    const uuid = () =>
      "xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx".replace(/x/g, () =>
        Math.floor(Math.random() * 16).toString(16)
      );
    s = uuid();
    await AsyncStorage.setItem(KEY, s);
  }
  return s;
}

async function markTaskCompleteOnServer({ device_id, task_id, qid }) {
  if (!device_id || !task_id) return;
  try {
    await fetch("https://varsitymessaging.com/api/task_complete.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ device_id, task_id, qid }),
    });
  } catch (e) {
    console.log("task_complete api error:", e?.message);
  }
}
 
async function registerDeviceBare({
  deviceId,
  installSecret,
  fcmtoken,
  tz,
  pro,
}) {
  if (!deviceId) return false;

  const URL = "https://varsitymessaging.com/api/register_device.php";
 
  const postWithTimeout = async (opts, ms = 15000) => {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), ms);
    try {
      const res = await fetch(URL, { ...opts, signal: ctl.signal });
      clearTimeout(t);
      const text = await res.text().catch(() => "");
      console.log(
        "[BOOT] register_device.php status:",
        res.status,
        "body:",
        text?.slice(0, 200)
      ); 
      const okByText = /ok|success/i.test(text || "");
      let okByJson = false;
      try {
        const j = JSON.parse(text);
        okByJson = j?.ok === true || j?.status === "ok" || j?.success === true;
      } catch {}
      return res.ok && (okByText || okByJson);
    } catch (e) {
      console.log("[BOOT] register_device fetch error:", e?.message);
      return false;
    }
  };
 
  const jsonOk = await postWithTimeout({
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json,text/plain,*/*",
    },
    body: JSON.stringify({
      device_id: deviceId,
      install_secret: installSecret || "",
      fcmtoken: fcmtoken || "",
      fcm_token: fcmtoken || "", 
      token: fcmtoken || "", 
      push_token: fcmtoken || "", 
      tz: tz || "UTC",
      pro: !!pro,
      source: "rnapp-json",
    }),
  });

  if (jsonOk) return true;
 
  const form = new URLSearchParams();
  form.append("device_id", deviceId);
  form.append("install_secret", installSecret || "");
  form.append("fcmtoken", fcmtoken || "");
  form.append("fcm_token", fcmtoken || "");
  form.append("token", fcmtoken || "");
  form.append("push_token", fcmtoken || "");
  form.append("tz", tz || "UTC");
  form.append("pro", (!!pro).toString());
  form.append("source", "rnapp-form");

  const formOk = await postWithTimeout({
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "text/plain,*/*",
    },
    body: form.toString(),
  });

  return formOk;
}
async function bootstrapIdentityAndToken() {
  const idRes = await ensureDeviceIdentity();
  const deviceId =
    idRes?.deviceId || (await AsyncStorage.getItem("sit/deviceId")) || "";
  const installSecret = await getOrCreateInstallSecret();

  try {
    await messaging().registerDeviceForRemoteMessages();
    await messaging().setAutoInitEnabled?.(true);
  } catch {}

  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
 
  let fcmtoken = await getFcmTokenRobust();
 
  if (!fcmtoken) {
    fcmtoken = await waitForFcmTokenGate({ timeoutMs: 60000, pollEvery: 800 });
  }
 
  let pro = false;
  try {
    const { isPro } = await import("./src/pro/store");
    pro = !!(await isPro?.());
  } catch {}
 
  try {
    await syncDeviceAndToken({ deviceId, installSecret, fcmtoken, tz, pro });
  } catch (e) {
    console.log("bootstrap syncDeviceAndToken failed:", e?.message); 
    await registerDeviceBare({ deviceId, installSecret, fcmtoken, tz, pro });
  }
 
  messaging().onTokenRefresh(async (t) => {
    try {
      await syncDeviceAndToken({
        deviceId,
        installSecret,
        fcmtoken: t,
        tz,
        pro: false,
      });
    } catch (e) {
      console.log("onTokenRefresh sync failed", e?.message);
      await registerDeviceBare({
        deviceId,
        installSecret,
        fcmtoken: t,
        tz,
        pro: false,
      });
    }
  });

  return { deviceId, installSecret, fcmtoken };
}
 
try {
  const originalSchedule = Notifications.scheduleNotificationAsync;
  Notifications.scheduleNotificationAsync = async (...args) => {
    console.warn(
      "SERVER_ONLY: blocked Notifications.scheduleNotificationAsync",
      args?.[0]?.content
    );
    return "server_only_blocked";
  };
} catch {}
try {
  const originalTrigger = notifee.createTriggerNotification;
  notifee.createTriggerNotification = async (...args) => {
    console.warn(
      "SERVER_ONLY: blocked notifee.createTriggerNotification",
      args?.[1]
    );
    return null;
  };
} catch {}

export default function App() {
  const [navReady, setNavReady] = useState(false);
  const [rootKey, setRootKey] = useState("root-1");
  const [initialRouteName, setInitialRouteName] = useState("Onboarding");
  const firstActiveSkipped = useRef(false);
 
  const [bootGateDone, setBootGateDone] = useState(false);
  const [bootGateHadToken, setBootGateHadToken] = useState(false);
 
  useEffect(() => {
    (async () => {
      try {
        let enabled = false;
        try {
          enabled = await messaging().isDeviceRegisteredForRemoteMessages?.();
          console.log("[DBG] isDeviceRegisteredForRemoteMessages:", enabled);
        } catch (e) {
          console.log(
            "[DBG] isDeviceRegisteredForRemoteMessages err:",
            e?.message || e
          );
        }
        console.log("[DBG] isDeviceRegisteredForRemoteMessages:", enabled);
      } catch (e) {
        console.log(
          "[DBG] isDeviceRegisteredForRemoteMessages err:",
          e?.message
        );
      }
      try {
        const settings = await Notifications.getPermissionsAsync();
        console.log("[DBG] notif permission:", settings);
      } catch (e) {
        console.log("[DBG] notif perm err:", e?.message);
      }
      try {
        const t = await messaging().getToken(); 
        console.log("[DBG] immediate getToken (peek):", t ? "yes" : "no");
      } catch (e) {
        console.log("[DBG] immediate getToken err:", e?.message);
      }
    })();
  }, []);
 
  useEffect(() => {
    (async () => {
      await mobileAds().initialize();
    })();
  }, []);
 
  useEffect(() => {
    (async () => {
      try {
        await loadProFromStorage();
        if (iapAvailable) {
          await initIapConnection();
          await restoreProFromPurchases();
          console.log("IAP initialized + restored");
          await preloadCatalog();
        } else {
          console.log("IAP not available; using fallback.");
        }
      } catch (e) {
        console.warn("IAP init/restore failed:", e?.message || e);
      }
    })();
  }, []);
 
  useEffect(() => {
    const unsub = notifee.onForegroundEvent(async ({ type, detail }) => {
      if (type !== EventType.ACTION_PRESS) return;
      const id = detail.pressAction.id;
      const data = detail.notification?.data || {};
      if (id === "DISMISS") {
        await notifee.cancelNotification(detail.notification?.id);
      }
      if (id === "COMPLETE") {
        await markTaskCompleteOnServer({
          device_id: data.device_id,
          task_id: data.task_id,
          qid: data.qid,
        });
        try {
          const tasks = await loadTasks();
          const idx = tasks.findIndex(
            (t) => String(t.id) === String(data.task_id)
          );
          if (idx !== -1) {
            tasks[idx] = { ...tasks[idx], done: true, completedAt: Date.now() };
            await saveTasks(tasks);
          }
        } catch (e) {
          console.log("local task patch failed", e?.message);
        }
        emitTasksUpdated({ taskId: String(data.task_id), done: true });
        await notifee.cancelNotification(detail.notification?.id);
      }
    });
    return () => unsub();
  }, []);
 
  useEffect(() => {
    let mounted = true;
    let unsubMsg = null;

    (async () => {
      try { 
        await ensureNotifPermission();
        await ensureAllChannels();

        const firstBoot = await isFirstBoot();
        let device = null;

        if (firstBoot) {
          console.log("[BOOT] first boot → HARD token fetch (<=60s)...");
 
          try {
            await firebase().setAutomaticDataCollectionEnabled(true);
            await firebase().setAutomaticResourceManagementEnabled?.(true);
          } catch (e) {
            console.log("[FCM] auto-collection err:", e?.message);
          }

          const idRes = await ensureDeviceIdentity();
          const deviceId =
            idRes?.deviceId ||
            (await AsyncStorage.getItem("sit/deviceId")) ||
            "";
          const installSecret = await getOrCreateInstallSecret();
          const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";

          const fcmtoken = await fetchFcmTokenFirstRun({
            timeoutMs: 60000,
            pollEvery: 1000,
          });
          const got = !!fcmtoken;
          setBootGateHadToken(got);
 
          let pro = false;
          try {
            const { isPro } = await import("./src/pro/store");
            pro = !!(await isPro?.());
          } catch {}

          let serverSaved = false;
          if (got) { 
            serverSaved = await registerDeviceBare({
              deviceId,
              installSecret,
              fcmtoken,
              tz,
              pro,
            });
 
            try {
              await syncDeviceAndToken({
                deviceId,
                installSecret,
                fcmtoken,
                tz,
                pro,
              });
              serverSaved = true;
            } catch (e) {
              console.log("[BOOT] syncDeviceAndToken failed:", e?.message);
            }
          }
 
          if (got && serverSaved) {
            await markFirstBootDone();
          } else {
            console.log(
              "[BOOT] token ya server save missing; will gate again next launch"
            );
          }

          device = { deviceId, installSecret, fcmtoken };
        } else {
          console.log("[BOOT] not first boot → normal bootstrap");
          device = await bootstrapIdentityAndToken();
        }
 
        unsubMsg = messaging().onMessage(async (m) => {
          const d = m?.data || {};
          const title = m?.notification?.title ?? d.title ?? "Reminder";
          const body = m?.notification?.body ?? d.body ?? "";
          const ch = d.channelId || d.android_channel_id || "blunt_1";
          const notifData = {
            device_id: d.device_id || "",
            task_id: d.task_id || "",
            qid: d.qid || "",
          };
          await notifee.displayNotification({
            title,
            body,
            data: notifData,
            android: {
              channelId: ch,
              pressAction: { id: "default" },
              actions: [
                { title: "Dismiss", pressAction: { id: "DISMISS" } },
                { title: "Completed", pressAction: { id: "COMPLETE" } },
              ],
            },
          });
        });
 
        try {
          if (device) await syncTasksToServer(device);
        } catch {}
        try {
          await Notifications.cancelAllScheduledNotificationsAsync();
        } catch {}
        try {
          await Notifications.setNotificationCategoryAsync("task_reminder", [
            {
              identifier: "dismiss_now",
              buttonTitle: "Dismiss",
              options: { opensAppToForeground: false },
            },
            {
              identifier: "mark_done",
              buttonTitle: "Mark Done",
              options: { opensAppToForeground: true },
            },
          ]);
          await initActionHandlers?.();
        } catch {}
        try {
          const s = await loadSettings();
          if (s?.keepAliveForeground && mounted) await startReminderService();
        } catch {}
      } catch (e) {
        console.log("App bootstrap error:", e);
      } finally { 
        setBootGateDone(true);
        emit("app/boot-ready");
      }
    })();

    return () => {
      mounted = false;
      if (unsubMsg) unsubMsg();
    };
  }, []);
 
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refreshPushTokenIfChanged();
    });
    return () => sub.remove();
  }, []);
 
  useEffect(() => {
    (async () => {
      try {
        if (global.__RELOADING__) {
          global.__RELOADING__ = false;
          setNavReady(true);
          return;
        }
        const skip = await consumeSkipSplashOnce();
        if (skip) {
          setInitialRouteName("Main");
        } else {
          const done = await isFirstRunDone();
          setInitialRouteName(done ? "Splash" : "Onboarding");
        }
      } finally {
        setNavReady(true);
      }
    })();
  }, [rootKey]);
 
  useEffect(() => {
    (async () => {
      await initInterstitial();
      await onAppOpenForInterstitial();
    })();
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") {
        if (!firstActiveSkipped.current) {
          firstActiveSkipped.current = true;
          return;
        }
        onAppOpenForInterstitial();
      }
    });
    return () => sub.remove();
  }, []);
 
  const appState = useRef(AppState.currentState);
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      const prev = appState.current;
      appState.current = next;
      if ((prev === "background" || prev === "inactive") && next === "active") {
        refreshAll("foreground");
      }
    });
    refreshAll("app-mount");
    return () => sub.remove();
  }, []);
 
  if (!bootGateDone) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <StatusBar barStyle="dark-content" />
        <ActivityIndicator size="large" />
        <View style={{ height: 12 }} />
        <Text style={{ color: "#9CA3AF", fontSize: 13 }}>
          getting device ready…
        </Text>
        <Text style={{ color: "#9CA3AF", fontSize: 12 }}>
          {bootGateHadToken ? "Token ready" : "Contacting Firebase…"}
        </Text>
      </View>
    );
  }

  if (!navReady) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#fff",
        }}
      >
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#fff" }}>
      <StatusBar barStyle="dark-content" />
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName={initialRouteName}
          detachInactiveScreens={false}
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: "#fff" },
            sceneContainerStyle: { backgroundColor: "#fff" },
          }}
        >
          <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          <Stack.Screen name="GetStarted" component={GetStartedScreen} />
          <Stack.Screen name="Splash" component={SplashScreen} />
          <Stack.Screen name="Main" component={RootNavigator} />
          <Stack.Screen name="AddTask" component={AddTaskScreen} />
          <Stack.Screen name="Calendar" component={CalendarScreen} />
          <Stack.Screen name="Analysis" component={AnalysisScreen} />
          <Stack.Screen name="UnlockPro" component={UnlockProScreen} />
          <Stack.Screen name="PrivacyPolicy" component={PrivacyPolicyScreen} />
          <Stack.Screen name="AboutUs" component={AboutScreen} />
          <Stack.Screen name="Donate" component={DonateScreen} />
        </Stack.Navigator>
      </NavigationContainer>

      {/* <ProTestButton /> */}
      {/* <DonationBadgeTestButton /> */}
      {/* <DebugAdsPanel /> */}
    </GestureHandlerRootView>
  );
}
