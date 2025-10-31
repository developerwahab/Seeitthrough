// src/backup/backup.js
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";

export async function exportJson(filename, dataObj) {
  const path = FileSystem.cacheDirectory + filename;
  await FileSystem.writeAsStringAsync(path, JSON.stringify(dataObj, null, 2), {
    encoding: FileSystem.EncodingType.UTF8,
  });
 
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(path, {
      mimeType: "application/json",
      dialogTitle: "Export data",
      UTI: "public.json",  
    });
  }
  return path;  
}

export async function importJson() {
  const res = await DocumentPicker.getDocumentAsync({
    type: "application/json",
    copyToCacheDirectory: true,
  });
  if (res.canceled || !res.assets?.length) return null;
  const { uri } = res.assets[0];
  const text = await FileSystem.readAsStringAsync(uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  return JSON.parse(text);
}
