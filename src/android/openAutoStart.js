// src/android/openAutoStart.js
import * as Application from 'expo-application';
import * as IntentLauncher from 'expo-intent-launcher';
import { Platform } from 'react-native';

export async function openAutoStartSettings() {
  if (Platform.OS !== 'android') return;
  const pkg = Application.applicationId;

  const candidates = [
    // Xiaomi / Redmi / POCO
    { action: 'miui.intent.action.OP_AUTO_START', pkg: 'com.miui.securitycenter' },
    { pkg: 'com.miui.securitycenter', cls: 'com.miui.permcenter.autostart.AutoStartManagementActivity' },
    // Oppo
    { pkg: 'com.coloros.safecenter', cls: 'com.coloros.safecenter.startupapp.StartupAppListActivity' },
    // Realme
    { pkg: 'com.realme.securitycenter', cls: 'com.realme.securitycenter.startupapp.StartupAppListActivity' },
    // Vivo
    { pkg: 'com.vivo.permissionmanager', cls: 'com.vivo.permissionmanager.activity.BgStartUpManagerActivity' },
    // Infinix / TECNO (HiOS)
    { pkg: 'com.transsion.phonemaster', cls: 'com.cyin.himgr.operation.autostart.AutoStartActivity' },
  ];

  for (const it of candidates) {
    try {
      if (it.action) {
        await IntentLauncher.startActivityAsync(it.action);
        return;
      }
      await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
        className: it.cls, packageName: it.pkg, data: `package:${pkg}`,
      });
      return;
    } catch {}
  }
}
