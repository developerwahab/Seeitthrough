// src/foreground/index.js (JS, not TS)
import ReactNativeForegroundService from '@supersami/rn-foreground-service';
import { AppState } from 'react-native'; 
import { loadSettings, saveSettings } from '../storage/tasks';

const TASK_ID = 'reminders_topup';

export async function startReminderService() {
  const s = await loadSettings();
  if (!s?.keepAliveForeground) return;  
 
  ReactNativeForegroundService.start({
    id: 2211,
    title: 'Smart Reminders',
    message: 'Keeping reminders active…',
    importance: 'max',
  });
 
  AppState.addEventListener('change', (st) => { 
  });
}

export function stopReminderService() {
  try { ReactNativeForegroundService.remove_task(TASK_ID); } catch {}
  try { ReactNativeForegroundService.stop(); } catch {}
}

export async function setKeepAliveForeground(enabled) {
  const s = await loadSettings();
  await saveSettings({ ...s, keepAliveForeground: !!enabled });
  if (enabled) await startReminderService(); else stopReminderService();
}
