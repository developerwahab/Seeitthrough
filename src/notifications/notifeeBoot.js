// src/notifications/notifeeBoot.js
import notifee, { EventType } from '@notifee/react-native';
notifee.onBackgroundEvent(async ({ type, detail }) => {
  switch (type) {
    case EventType.ACTION_PRESS: break;
    default: break;
  }
});
