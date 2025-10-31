// // src/push/registerFCM.js
// import * as Notifications from 'expo-notifications';
// import { Platform } from 'react-native';
// import Constants from 'expo-constants';
// // If you already have a wrapper, keep it. Otherwise use AsyncStorage directly:
// import AsyncStorage from '../utils/safeAsyncStorage'; // or '@react-native-async-storage/async-storage'

// const API_BASE = 'https://varsitymessaging.com/api'; // <-- apna base confirm rakhna

// const DID_KEY = 'sit/deviceId';
// const FCM_KEY = 'sit/fcmToken';

// // ultra-light uuid (no deps)
// const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
//   const r = (Math.random() * 16) | 0;
//   const v = c === 'x' ? r : (r & 0x3) | 0x8;
//   return v.toString(16);
// });

// // Never coerce undefined to string. Only return a proper id.
// async function getStableDeviceId() {
//   let id = await AsyncStorage.getItem(DID_KEY);
//   if (!id) {
//     // Make an install-scoped id. Do NOT use Device.deviceName/osInternalBuildId (unreliable on many Androids)
//     id = `sit-${Platform.OS}-${uuid()}`;
//     await AsyncStorage.setItem(DID_KEY, id);
//   }
//   return id;
// }

// async function ensureNotifPermission() {
//   const settings = await Notifications.getPermissionsAsync();
//   if (!settings.granted) {
//     const req = await Notifications.requestPermissionsAsync();
//     // don't block; even if denied, we still register device row without token
//   }
//   // Android channel (so heads-up works)
//   if (Platform.OS === 'android') {
//      await Notifications.setNotificationChannelAsync('sit_blunt', {
//       name: 'Reminders',
//       importance: Notifications.AndroidImportance.HIGH,
//       bypassDnd: false,
//       sound: 'default',
//       lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
//       vibrationPattern: [250, 250, 250, 250],
//     });
//   }
// }

// async function getFcmTokenSafe() {
//   try {
//     const res = await Notifications.getDevicePushTokenAsync({ provider: 'FCM' });
//     console.log('getDevicePushTokenAsync result:', res);
//     if (res && res.type === 'fcm' && res.data) return res.data;
//   } catch (e) {
//     console.log('getDevicePushTokenAsync error:', e);
//   }
//   return null;
// }

// async function postJSON(path, body) {
//   const res = await fetch(`${API_BASE}${path}`, {
//     method: 'POST',
//     headers: { 'Content-Type': 'application/json' },
//     body: JSON.stringify(body),
//   });
//   // ignore non-200 quietly (just log), don't crash user
//   try { return await res.json(); } catch { return null; }
// }

// let inflight = null;

// /**
//  * Call once on app start. Returns { deviceId, fcmToken, tz }.
//  */
// export async function ensureDeviceIdentity() {
//   if (inflight) return inflight;
//   inflight = (async () => {
//     const deviceId = await getStableDeviceId(); // guaranteed non-empty
//     await ensureNotifPermission();

//     const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');

//     // get token + detect changes
//     const fcmToken = await getFcmTokenSafe();
//     const lastSaved = await AsyncStorage.getItem(FCM_KEY);
//     if (fcmToken && fcmToken !== lastSaved) {
//       await AsyncStorage.setItem(FCM_KEY, fcmToken);
//     }

//     // **Never** send undefined/null as string. Only include keys if they exist.
//     const payload = { device_id: deviceId, tz };
//     if (fcmToken) payload.fcm_token = fcmToken;

//     // Hit your server's upsert endpoint
//     await postJSON('/register_device.php', payload);

//     return { deviceId, fcmToken: fcmToken || null, tz };
//   })();

//   try {
//     const out = await inflight;
//     return out;
//   } finally {
//     inflight = null;
//   }
// }

// /**
//  * Optional: call on app resume to refresh FCM if it rotated.
//  */
// export async function refreshPushTokenIfChanged() {
//   const deviceId = await getStableDeviceId();
//   const tz = (Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC');
//   const current = await getFcmTokenSafe();
//   const saved = await AsyncStorage.getItem(FCM_KEY);

//   if (current && current !== saved) {
//     await AsyncStorage.setItem(FCM_KEY, current);
//     await postJSON('/register_device.php', { device_id: deviceId, tz, fcm_token: current });
//   }
// }







// src/push/registerFCM.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '../utils/safeAsyncStorage'; 
import { getFcmTokenRobust } from './getFcmToken';

const API_BASE = 'https://varsitymessaging.com/api';  
const DID_KEY = 'sit/deviceId';
const FCM_KEY = 'sit/fcmToken';

const uuid = () =>
  'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });

async function getStableDeviceId() {
  let id = await AsyncStorage.getItem(DID_KEY);
  if (!id) {
    id = `sit-${Platform.OS}-${uuid()}`;
    await AsyncStorage.setItem(DID_KEY, id);
  }
  return id;
}

async function ensureNotifPermission() {
  const settings = await Notifications.getPermissionsAsync();
  if (!settings.granted) { 
    await Notifications.requestPermissionsAsync();
  }

  if (Platform.OS === 'android') {
    try {
      await Notifications.setNotificationChannelAsync('sit_blunt', {
        name: 'Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        bypassDnd: false,
        sound: 'default',
        lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC,
        vibrationPattern: [250, 250, 250, 250],
      });
    } catch (e) {
      console.log('[registerFCM] setNotificationChannelAsync err', e?.message || e);
    }
  }
}

async function postJSON(path, body) {
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return await res.json().catch(() => null);
  } catch (e) {
    console.log('[registerFCM] postJSON err', e?.message || e);
    return null;
  }
}

let inflight = null;
 
export async function ensureDeviceIdentity() {
  if (inflight) return inflight;
  inflight = (async () => {
    const deviceId = await getStableDeviceId();
    await ensureNotifPermission();

    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
 
    const fcmToken = await getFcmTokenRobust({ timeoutMs: 30000, pollEvery: 800 });
 
    if (fcmToken) {
      try {
        const lastSaved = await AsyncStorage.getItem(FCM_KEY);
        if (fcmToken !== lastSaved) {
          await AsyncStorage.setItem(FCM_KEY, fcmToken);
        }
      } catch (e) {
        console.log('[registerFCM] saving token err', e?.message || e);
      }
    }
 
    const payload = { device_id: deviceId, tz };
    if (fcmToken) payload.fcm_token = fcmToken;
 
    await postJSON('/register_device.php', payload);

    return { deviceId, fcmToken: fcmToken || null, tz };
  })();

  try {
    const out = await inflight;
    return out;
  } finally {
    inflight = null;
  }
}

export async function refreshPushTokenIfChanged() {
  const deviceId = await getStableDeviceId();
  const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';

  const current = await getFcmTokenRobust({ timeoutMs: 15000, pollEvery: 700 });
  if (!current) return null;

  const saved = await AsyncStorage.getItem(FCM_KEY);
  if (current && current !== saved) {
    await AsyncStorage.setItem(FCM_KEY, current);
    await postJSON('/register_device.php', { device_id: deviceId, tz, fcm_token: current });
  }
  return current;
}
