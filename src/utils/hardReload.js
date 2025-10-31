// src/utils/hardReload.js
export async function hardReloadApp() { 
  try {
    const Updates = require("expo-updates");
    if (Updates?.reloadAsync) {
      await Updates.reloadAsync();
      return;
    }
  } catch {}
 
  try {
    if (__DEV__) {
      const { DevSettings } = require("react-native");
      DevSettings.reload();
      return;
    }
  } catch {}
 
  try {
    const { emit } = require("../events/bus");
    emit("app/hard-remount");
  } catch {}
}
