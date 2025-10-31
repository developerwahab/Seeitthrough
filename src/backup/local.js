// src/backup/local.js
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

const { StorageAccessFramework: SAF } = FileSystem;
 
async function loadAllDataSafe() { 
  try {
    const mod = require("../storage/backup");
    if (typeof mod.loadAllData === "function") {
      const data = await mod.loadAllData();
      return data || {};
    }
  } catch {} 
  try {
    const st = require("../storage/tasks");
    const tasks =
      typeof st.loadTasks === "function" ? await st.loadTasks() : [];
    const settings =
      typeof st.loadSettings === "function" ? await st.loadSettings() : {};
    return { tasks, settings };
  } catch {
    return { tasks: [], settings: {} };
  }
}

async function restoreAllDataSafe(payload) { 
  try {
    const mod = require("../storage/backup");
    if (typeof mod.restoreAllData === "function") {
      await mod.restoreAllData(payload || {});
      return true;
    }
  } catch {} 
  try {
    const st = require("../storage/tasks");
    if (typeof st.saveTasks === "function") {
      await st.saveTasks(Array.isArray(payload?.tasks) ? payload.tasks : []);
    }
    if (typeof st.saveSettings === "function" && payload?.settings) {
      await st.saveSettings(payload.settings);
    }
    return true;
  } catch {
    return false;
  }
}

function nowStamp() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}_${pad(
    d.getHours()
  )}-${pad(d.getMinutes())}`;
}
 
export async function exportBackup() {
  const data = await loadAllDataSafe();
  const json = JSON.stringify({ v: 1, createdAt: Date.now(), data }, null, 2);
  const filename = `see-it-through_backup_${nowStamp()}.json`;

  if (Platform.OS === "android" && SAF) { 
    const perm = await SAF.requestDirectoryPermissionsAsync();
    if (!perm.granted) throw new Error("Folder permission denied");

    const fileUri = await SAF.createFileAsync(
      perm.directoryUri,
      filename,
      "application/json"
    );
    await FileSystem.writeAsStringAsync(fileUri, json, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    return { ok: true, path: fileUri };
  }
 
  const path = FileSystem.documentDirectory + filename;
  await FileSystem.writeAsStringAsync(path, json, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(path);
    }
  } catch {}
  return { ok: true, path };
}
 
export async function importBackup() {
  const res = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (res.canceled) throw new Error("User cancelled");

  const uri = res.assets?.[0]?.uri;
  if (!uri) throw new Error("No file selected");

  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("Invalid JSON");
  }
 
  const payload =
    parsed?.data && typeof parsed.data === "object" ? parsed.data : parsed;

  const ok = await restoreAllDataSafe(payload);
  if (!ok) throw new Error("Restore failed (no storage handlers)");

  return { ok: true };
}
