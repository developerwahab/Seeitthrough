// // src/notifications/notifeeExact.js
import notifee from '@notifee/react-native';

const SERVER_ONLY = true;

export async function createExactTriggerNotification(notification, trigger) {
  if (SERVER_ONLY) { 
    console.warn('SERVER_ONLY: blocked notifee.createTriggerNotification');
    return null;
  } 
}
