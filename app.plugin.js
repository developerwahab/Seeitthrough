// app.plugin.js
const { withAndroidManifest, AndroidConfig } = require("@expo/config-plugins");

const ADMOB_NAME = "com.google.android.gms.ads.APPLICATION_ID"; 
const ADMOB_VALUE = "ca-app-pub-3940256099942544~3347511713"; 

module.exports = function withCustomAndroidManifest(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
 
    manifest.$["xmlns:tools"] = manifest.$["xmlns:tools"] || "http://schemas.android.com/tools";
 
    const ensurePermission = (name) => {
      const arr = manifest["uses-permission"] || [];
      const has = arr.some((p) => p.$["android:name"] === name);
      if (!has) {
        arr.push({ $: { "android:name": name } });
        manifest["uses-permission"] = arr;
      }
    };

    ensurePermission("android.permission.FOREGROUND_SERVICE");
    ensurePermission("android.permission.FOREGROUND_SERVICE_DATA_SYNC");
    ensurePermission("android.permission.RECEIVE_BOOT_COMPLETED"); 
    ensurePermission("android.permission.SCHEDULE_EXACT_ALARM");
    ensurePermission("android.permission.POST_NOTIFICATIONS");
 
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(config.modResults);
 
    app["meta-data"] = app["meta-data"] || [];
    const mdKey = ADMOB_NAME;
    const mdIdx = app["meta-data"].findIndex((m) => m.$["android:name"] === mdKey);
    const mdEntry = {
      $: {
        "android:name": mdKey,
        "android:value": ADMOB_VALUE,
        "tools:replace": "android:value",
      },
    };
    if (mdIdx >= 0) app["meta-data"][mdIdx] = mdEntry;
    else app["meta-data"].push(mdEntry);
 
    app.service = app.service || [];
    const svcName = "com.supersami.foregroundservice.ForegroundService";
    const hasService = app.service.some((s) => s.$["android:name"] === svcName);
    if (!hasService) {
      app.service.push({
        $: {
          "android:name": svcName,
          "android:exported": "false",
          "android:foregroundServiceType": "dataSync",
        },
      });
    }

    return config;
  });
};
