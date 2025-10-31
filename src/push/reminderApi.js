// src/push/reminderApi.js
import { api } from './api';
 
export async function scheduleReminderOnServer({
  device_id,
  task_id = 'adhoc',
  title,
  body,
  fireAtISO,
  channelId = 'blunt_4',   
  showActions = true,       
}) {
  const delaySec = fireAtISO
    ? Math.max(0, Math.floor((new Date(fireAtISO).getTime() - Date.now()) / 1000))
    : 0;

  const resp = await api.enqueue({
    device_id,
    task_id,
    title: title || 'Reminder',
    body: body || '',
    delaySec,
    android_channel_id: channelId, 
    withActions: showActions ? '1' : '0',
  });

  return !!resp;
}
