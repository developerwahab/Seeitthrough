import React, { useEffect, useState } from 'react';
import { View, Text, Button, ScrollView, Platform } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance } from '@notifee/react-native';
 
const API_BASE = 'https://varsitymessaging.com/api';     
const API_KEY  = 'trendbazar_SUPER_SECRET_2025_!@#'; 

async function ensureChannel() {
  if (Platform.OS !== 'android') return;
  await notifee.createChannel({
    id: 'sit_high',
    name: 'See It Through — High',
    importance: AndroidImportance.HIGH,
    sound: 'default',
    vibration: true,
    lights: true,
  });
}

export default function TestScreen() {
  const [token, setToken] = useState('');

  useEffect(() => {
    (async () => {
      await ensureChannel();
      const perm = await messaging().requestPermission();
      const ok = perm === messaging.AuthorizationStatus.AUTHORIZED ||
                 perm === messaging.AuthorizationStatus.PROVISIONAL;
      if (!ok) return;

      const t = await messaging().getToken();
      setToken(t);
 
      await fetch(`${API_BASE}/register_device.php`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
        body: JSON.stringify({ device_id: 'anon-android', fcm_token: t })
      });
 
      messaging().onMessage(async rm => {
        if (!rm.notification) {
          await notifee.displayNotification({
            title: rm.data?.title ?? 'Reminder',
            body: rm.data?.body ?? '',
            android: { channelId: 'sit_high', pressAction: { id: 'default' } }
          });
        }
      });
    })();
  }, []);

  const sendDebugNow = async () => {
    if (!token) return;
    const r = await fetch(`${API_BASE}/debug_send.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        fcm_token: token,
        title: 'Debug Push',
        body: 'If you see this, Firebase wiring is OK!',
        android_channel_id: 'sit_high'
      })
    });
    console.log('debug_send status', r.status);
  };

  const schedulePlus1Min = async () => {
    if (!token) return;
    const fire = new Date(Date.now() + 60 * 1000).toISOString();
    const r = await fetch(`${API_BASE}/schedule_reminder.php`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-api-key': API_KEY },
      body: JSON.stringify({
        fcm_token: token,
        title: 'Server Reminder',
        body: 'Cron should deliver this in ~1 min',
        fire_at_utc: fire,
        android_channel_id: 'sit_high',
        data: { screen: 'TaskDetail', taskId: '123' }
      })
    });
    console.log('schedule status', r.status);
  };

  return (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }}>
      <Text selectable>FCM TOKEN:</Text>
      <Text selectable style={{ fontSize: 12 }}>{token || '...'}</Text>
      <Button title="1) Send Debug Push NOW" onPress={sendDebugNow} />
      <Button title="2) Schedule +1 minute (cron)" onPress={schedulePlus1Min} />
      <Text>Tip: It'll also work in Background too :)</Text>
    </ScrollView>
  );
}
