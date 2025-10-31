// src/push/getDeviceId.js
import * as Application from 'expo-application';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export async function getDeviceId() {
  let id = null;

  if (Platform.OS === 'android') {
    try {
      id = await Application.getAndroidIdAsync();  
    } catch {}
  }
 
  id = id || Application.applicationId || Device.modelId || Device.osBuildId;
  if (!id) id = `dev-${Platform.OS}-${Date.now()}`;

  return String(id);
}
