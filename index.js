// index.js
import { registerRootComponent } from 'expo';
import 'react-native-gesture-handler';

import notifee, { EventType } from '@notifee/react-native';
import messaging from '@react-native-firebase/messaging';
import { loadTasks, saveTasks } from './src/storage/tasks';
import { emit } from './src/events/bus';

messaging().setBackgroundMessageHandler(async (m) => {
  const d = m?.data || {};
  await notifee.displayNotification({
    title: m?.notification?.title ?? d.title ?? 'Reminder',
    body:  m?.notification?.body  ?? d.body  ?? '',
    data: {
      device_id: d.device_id || '',
      task_id:   d.task_id   || '',
      qid:       d.qid       || '',
    },
    android: {
      channelId: d.channelId || d.android_channel_id || 'blunt_1',
      pressAction: { id: 'default' },
      actions: [
        { title: 'Dismiss',   pressAction: { id: 'DISMISS' } },
        { title: 'Completed', pressAction: { id: 'COMPLETE' } },
      ],
    },
  });
});
 
notifee.onBackgroundEvent(async ({ type, detail }) => {
  if (type !== EventType.ACTION_PRESS) return;
  const id = detail.pressAction.id;
  const data = detail.notification?.data || {};
  if (id === 'COMPLETE') {
    try {
      await fetch('https://varsitymessaging.com/api/task_complete.php', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          device_id: data.device_id, task_id: data.task_id, qid: data.qid
        }),
      });
    } catch (_) {}
    try {
  const tasks = await loadTasks();
  const idx = tasks.findIndex(t => String(t.id) === String(data.task_id));
  if (idx !== -1) {
    tasks[idx] = { ...tasks[idx], done: true, completedAt: Date.now() };
    await saveTasks(tasks);
  } 
  try { emit('TASKS_UPDATED', { taskId: String(data.task_id), done: true }); } catch {}
} catch (_) {}
  }
  await notifee.cancelNotification(detail.notification?.id);
});

import App from './App';
registerRootComponent(App);
