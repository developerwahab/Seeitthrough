// screens/SettingsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import * as IntentLauncher from "expo-intent-launcher";
import { useNavigation } from "@react-navigation/native";
import { promptExactAlarmSettings } from "../src/notifications/exactAlarm";
import { Ionicons } from "@expo/vector-icons";
import RNFSvc from "@supersami/rn-foreground-service";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { setKeepAliveForeground } from "../src/foreground"; 
  
import * as FileSystem from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
 
const CLIENT_ID = "<YOUR_ANDROID_OAUTH_CLIENT_ID>"; 
const INTENSITIES = ["MILD", "MEDIUM", "AGGRESSIVE"];
const TONES_FREE = ["BLUNT"];
const TONES_ALL = ["BLUNT", "SUPPORTIVE", "SPOUSE", "DRILL"];
 
const TASKS_KEY = "tasks.v1";
const SETTINGS_KEY = "settings.v1";

async function loadTasksSafe() {
  try {
    const mod = require("../src/storage/tasks");
    if (typeof mod.loadTasks === "function") return await mod.loadTasks();
  } catch {}
  try {
    const raw = await AsyncStorage.getItem(TASKS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}
async function saveTasksSafe(list) {
  try {
    const mod = require("../src/storage/tasks");
    if (typeof mod.saveTasks === "function") return await mod.saveTasks(list);
  } catch {}
  try {
    await AsyncStorage.setItem(TASKS_KEY, JSON.stringify(list || []));
  } catch {}
  return list || [];
}
async function loadSettingsSafe() {
  try {
    const mod = require("../src/storage/tasks");
    if (typeof mod.loadSettings === "function") return await mod.loadSettings();
  } catch {}
  try {
    const raw = await AsyncStorage.getItem(SETTINGS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
async function saveSettingsSafe(obj) {
  try {
    const mod = require("../src/storage/tasks");
    if (typeof mod.saveSettings === "function")
      return await mod.saveSettings(obj);
  } catch {}
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(obj || {}));
  } catch {}
  return obj || {};
}
 
async function isPaidSafe() {
  try {
    const mod = require("../src/payments/store");
    if (typeof mod.isPaid === "function") return await mod.isPaid();
  } catch {}
  try {
    const pro = require("../src/pro/store");
    if (typeof pro.isPro === "function") return !!pro.isPro();
    if (typeof pro.getPro === "function") return !!(await pro.getPro());
  } catch {}
  return false;
}
async function purchasePremiumSafe() {
  try {
    const mod = require("../src/payments/store");
    if (typeof mod.purchasePremium === "function")
      return await mod.purchasePremium();
  } catch {}
  try {
    const iap = require("../src/pro/iap");
    if (typeof iap.buyUnlockSku === "function") {
      const list =
        typeof iap.getUnlockSkus === "function"
          ? await iap.getUnlockSkus()
          : [];
      const sku = list?.[0]?.productId || "pro_unlock";
      return await iap.buyUnlockSku(sku);
    }
  } catch {}
  throw new Error("Purchase API not available in this build.");
}
async function restorePremiumSafe() {
  try {
    const mod = require("../src/payments/store");
    if (typeof mod.restorePremium === "function")
      return await mod.restorePremium();
  } catch {}
  try {
    const iap = require("../src/pro/iap");
    if (typeof iap.restorePremium === "function")
      return await iap.restorePremium();
  } catch {}
  return false;
} 
async function driveSignInSafe(clientId) {
  try {
    const drv = require("../src/backup/drive");
    if (typeof drv.signInAsync === "function")
      return await drv.signInAsync(clientId);
  } catch {}
  throw new Error("Drive sign-in not configured.");
}
async function driveBackupJsonSafe(filename, data) {
  try {
    const drv = require("../src/backup/drive");
    if (typeof drv.backupJson === "function")
      return await drv.backupJson(filename, data);
    if (typeof drv.backupToDrive === "function")
      return await drv.backupToDrive(filename, data);
  } catch {}
  throw new Error("Drive backup not configured.");
}
async function driveRestoreLatestSafe(filename) {
  try {
    const drv = require("../src/backup/drive");
    if (typeof drv.restoreLatest === "function")
      return await drv.restoreLatest(filename);
    if (typeof drv.restoreFromDrive === "function")
      return await drv.restoreFromDrive(filename);
  } catch {}
  throw new Error("Drive restore not configured.");
}
 
export default function SettingsScreen() {
  const navigation = useNavigation();

  const [winStart, setWinStart] = useState({ h: 9, m: 0 });
  const [winEnd, setWinEnd] = useState({ h: 20, m: 0 });
  const [calendarAware, setCalendarAware] = useState(true);
  const [defaultIntensity, setDefaultIntensity] = useState("MEDIUM");
  const [tone, setTone] = useState("BLUNT");

  const [paid, setPaid] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      const s = (await loadSettingsSafe()) || {};
      const rw = s.reminderWindow || {};
      setWinStart(rw.start ?? { h: 9, m: 0 });
      setWinEnd(rw.end ?? { h: 20, m: 0 });
      setCalendarAware(!!s.calendarAware);
      setDefaultIntensity(s.defaultIntensity || "MEDIUM");
      setTone(s.tone || s.defaultTone || "BLUNT");
      try {
        setPaid(await isPaidSafe());
      } catch {}
    })();
  }, []);
 
  const pad2 = (n) => String(n).padStart(2, "0");
 
  const save = async () => {
    const wsMins = winStart.h * 60 + (winStart.m || 0);
    const weMins = winEnd.h * 60 + (winEnd.m || 0);

    await saveSettingsSafe({ 
      reminderWindow: { start: winStart, end: winEnd },
 
      windowStartMins: wsMins,
      windowEndMins: weMins,
      windowStart: `${pad2(winStart.h)}:${pad2(winStart.m || 0)}`,
      windowEnd: `${pad2(winEnd.h)}:${pad2(winEnd.m || 0)}`,

      calendarAware,
      defaultIntensity,
      tone,
      defaultTone: tone,
    });
    Alert.alert("Saved", "Defaults updated.");
  };
 
  async function exportJson() {
    try {
      const blob = {
        tasks: await loadTasksSafe(),
        settings: await loadSettingsSafe(),
      };
      const path = FileSystem.documentDirectory + "sit-export.json";
      await FileSystem.writeAsStringAsync(path, JSON.stringify(blob, null, 2));
      await Sharing.shareAsync(path);
    } catch (e) {
      Alert.alert("Export failed", e?.message || "Unknown error");
    }
  }
  async function importJson() {
    try {
      const pick = await DocumentPicker.getDocumentAsync({
        type: "application/json",
      });
      if (pick.canceled) return;
      const text = await FileSystem.readAsStringAsync(pick.assets[0].uri);
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== "object") throw new Error("Bad file");
      if (parsed.settings) await saveSettingsSafe(parsed.settings);
      if (Array.isArray(parsed.tasks)) await saveTasksSafe(parsed.tasks);
      Alert.alert("Import complete", "Data restored locally.");
    } catch (e) {
      Alert.alert("Import failed", e?.message || "Unknown error");
    }
  }
 
  async function onBackup() {
    try {
      if (!CLIENT_ID || CLIENT_ID.includes("<YOUR"))
        throw new Error("Set CLIENT_ID first in SettingsScreen.js");
      setBusy(true);
      await driveSignInSafe(CLIENT_ID);
      const data = {
        tasks: await loadTasksSafe(),
        settings: await loadSettingsSafe(),
      };
      await driveBackupJsonSafe("sit-backup.json", data);
      Alert.alert("Backup complete", "Saved to Google Drive (AppData).");
    } catch (e) {
      Alert.alert("Backup failed", e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }
  async function onRestore() {
    try {
      if (!CLIENT_ID || CLIENT_ID.includes("<YOUR"))
        throw new Error("Set CLIENT_ID first in SettingsScreen.js");
      setBusy(true);
      await driveSignInSafe(CLIENT_ID);
      const data = await driveRestoreLatestSafe("sit-backup.json");
      if (data?.settings) await saveSettingsSafe(data.settings);
      if (Array.isArray(data?.tasks)) await saveTasksSafe(data.tasks);
      Alert.alert("Restore complete", "Data restored from Drive.");
    } catch (e) {
      Alert.alert("Restore failed", e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }
 
  async function onUpgrade() {
    try {
      setBusy(true);
      const ok = await purchasePremiumSafe();
      if (ok !== false) {
        setPaid(true);
        Alert.alert("Thanks!", "Premium unlocked.");
        return;
      }
    } catch (e) {
      try {
        navigation.navigate("UnlockPro");
        return;
      } catch {}
      Alert.alert(
        "Purchase failed",
        e?.message ||
          "Build a Dev Client / Play Internal Test to test purchases."
      );
    } finally {
      setBusy(false);
    }
  }
  async function onRestorePurchase() {
    try {
      setBusy(true);
      const ok = await restorePremiumSafe();
      setPaid(!!ok);
      Alert.alert(
        ok ? "Restored" : "Not found",
        ok ? "Premium restored." : "No purchase found for this Google account."
      );
    } catch (e) {
      Alert.alert("Restore failed", e?.message || "Unknown error");
    } finally {
      setBusy(false);
    }
  }

  const tones = paid ? TONES_ALL : TONES_FREE;
 
  const Chip = ({ on, label, onPress }) => (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.9}
      style={[styles.chip, on && styles.chipOn]}
    >
      <Text style={[styles.chipTxt, on && styles.chipTxtOn]}>{label}</Text>
    </TouchableOpacity>
  );

  const Card = ({ title, icon, children, footer }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderL}>
          <View style={styles.cardIcon}>{icon}</View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
      <View style={{ marginTop: 10 }}>{children}</View>
      {footer ? <View style={{ marginTop: 14 }}>{footer}</View> : null}
    </View>
  );

  return (
    <View style={styles.screen}>
      {/* Top bar */}
      <View style={styles.topbar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.topBtn}
          activeOpacity={0.9}
        >
          <Ionicons name="chevron-back" size={18} color="#111827" />
        </TouchableOpacity>
        <Text style={styles.topTitle}>Settings</Text>
        <TouchableOpacity style={styles.topBtn} activeOpacity={0.9}>
          <Ionicons name="settings-outline" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.container}
        showsVerticalScrollIndicator={false}
      >
        {/* Defaults */}
        <Card
          title="Defaults"
          icon={<Ionicons name="options-outline" size={16} color="#111827" />}
          footer={
            <TouchableOpacity
              onPress={save}
              style={styles.primaryBtn}
              activeOpacity={0.9}
            >
              <Text style={styles.primaryBtnTxt}>Save Defaults</Text>
            </TouchableOpacity>
          }
        >
          <Text style={[styles.label, { marginTop: 10 }]}>
            Default Reminder Window
          </Text>
          <View style={styles.windowRow}>
            <View style={styles.inputBox}>
              <Text style={styles.inputLbl}>Start hour</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(winStart.h)}
                onChangeText={(v) =>
                  setWinStart({
                    ...winStart,
                    h: Math.max(0, Math.min(23, Number(v) || 0)),
                  })
                }
                placeholder="9"
                placeholderTextColor="#9CA3AF"
              />
            </View>
            <Ionicons
              name="arrow-forward"
              size={16}
              color="#9CA3AF"
              style={{ marginTop: 22 }}
            />
            <View style={styles.inputBox}>
              <Text style={styles.inputLbl}>End hour</Text>
              <TextInput
                style={styles.input}
                keyboardType="numeric"
                value={String(winEnd.h)}
                onChangeText={(v) =>
                  setWinEnd({
                    ...winEnd,
                    h: Math.max(0, Math.min(23, Number(v) || 0)),
                  })
                }
                placeholder="20"
                placeholderTextColor="#9CA3AF"
              />
            </View>
          </View>

          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Calendar Aware</Text>
            <Switch value={calendarAware} onValueChange={setCalendarAware} />
          </View>
        </Card>

        {/* Keep-alive foreground toggle */}
        <KeepAliveToggle />

        {/* Backup & Restore */}
        <Card
          title="Backup & Restore"
          icon={<Ionicons name="cloud-outline" size={16} color="#111827" />}
        >
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={exportJson}
              activeOpacity={0.9}
            >
              <Ionicons name="share-outline" size={16} color="#111827" />
              <Text style={styles.ghostBtnTxt}>Export Settings</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.ghostBtn}
              onPress={importJson}
              activeOpacity={0.9}
            >
              <Ionicons
                name="document-text-outline"
                size={16}
                color="#111827"
              />
              <Text style={styles.ghostBtnTxt}>Import Settings</Text>
            </TouchableOpacity>
          </View>
        </Card>

        {/* Premium */}
        <Card
          title="Premium"
          icon={<Ionicons name="sparkles-outline" size={16} color="#111827" />}
        >
          {!paid ? (
            <View style={styles.btnRow}>
              <TouchableOpacity
                style={[styles.primaryBtn, { flex: 1 }]}
                onPress={() => {
                  navigation.closeDrawer?.();
                  navigation.navigate("UnlockPro");
                }}
                disabled={busy}
                activeOpacity={0.9}
              >
                <Text style={styles.primaryBtnTxt}>Upgrade</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.secondaryBtn, { flex: 1 }]}
                onPress={onRestorePurchase}
                disabled={busy}
                activeOpacity={0.9}
              >
                <Text style={styles.secondaryBtnTxt}>Restore Purchase</Text>
              </TouchableOpacity>

              <Text style={styles.help}>
                Tip: Pro_Unlock grants full access. Donations are optional and
                don’t change features.
                <Text style={{ fontWeight: "700" }}> Account</Text> is not
                required for any Purchasing.
              </Text>
            </View>
          ) : (
            <View style={styles.proBadge}>
              <Ionicons name="shield-checkmark" size={16} color="#10B981" />
              <Text style={styles.proBadgeTxt}>
                Premium active — Ads off, Aggressive & all tones unlocked.
              </Text>
            </View>
          )}
        </Card>
 
        {/* <DeliveryFixesCard /> */}

        <View style={{ height: 28 }} />
      </ScrollView>
    </View>
  );
}
 
function KeepAliveToggle() {
  const [on, setOn] = useState(false);

  useEffect(() => {
    let mounted = true;
    loadSettingsSafe().then((s) => {
      if (mounted) setOn(!!s?.keepAliveForeground);
    });
    return () => {
      mounted = false;
    };
  }, []);

  const Card = ({ title, icon, children, footer }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderL}>
          <View style={styles.cardIcon}>{icon}</View>
          <Text style={styles.cardTitle}>{title}</Text>
        </View>
      </View>
      <View style={{ marginTop: 10 }}>{children}</View>
      {footer ? <View style={{ marginTop: 14 }}>{footer}</View> : null}
    </View>
  );

  return (
    <Card
      title="Notifications"
      icon={<Ionicons name="notifications-outline" size={16} color="#111827" />}
    >
      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>Keep reminders in background</Text>
        <Switch
          value={on}
          onValueChange={async (v) => {
            setOn(v);
            await setKeepAliveForeground(v);
          }}
        />
      </View>

      <Text style={styles.helperMuted}>
        Some devices aggressively kill background timers. Turning this on keeps
        reminders firing on time.
      </Text>

      <View style={styles.permissionCard}>
        <Text style={styles.permissionTitle}>Allow “Alarms & Reminders”</Text>

        <Text style={styles.permissionBody}>
          To make sure your reminders always ring on time (even if the app is
          closed or phone is locked), please allow
          <Text style={{ fontWeight: "700" }}> Alarms & Reminders</Text>{" "}
          permission.
        </Text>

        <TouchableOpacity
          onPress={promptExactAlarmSettings}
          activeOpacity={0.9}
          style={styles.permissionBtn}
        >
          <Text style={styles.permissionBtnTxt}>Tap once (Android 6 or below)</Text>
        </TouchableOpacity>

        {/* <Text style={styles.permissionHint}>
          Required only once on Android 12+. After allowing, you won’t be asked
          again.
        </Text> */}
      </View>
    </Card>
  );
}
 
function DeliveryFixesCard() {
  async function openAutoStart() {
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.APPLICATION_DETAILS_SETTINGS"
      );
    } catch {}
  }
  async function openBattery() {
    try {
      await IntentLauncher.startActivityAsync(
        "android.settings.IGNORE_BATTERY_OPTIMIZATION_SETTINGS"
      );
    } catch {}
  }
  return (
    <View
      style={{
        padding: 16,
        backgroundColor: "#fff3cd",
        borderRadius: 12,
        gap: 10,
      }}
    >
      <Text style={{ fontWeight: "700", fontSize: 16 }}>
        Improve delivery on this phone
      </Text>
      <Text>
        Allow auto-start, disable battery restrictions, and permit exact alarms.
      </Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
        <TouchableOpacity onPress={openAutoStart} style={btn}>
          <Text style={btnt}>Open App Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={openBattery} style={btn}>
          <Text style={btnt}>Battery optimization</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={promptExactAlarmSettings} style={btn}>
          <Text style={btnt}>Exact alarms</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const btn = {
  paddingVertical: 10,
  paddingHorizontal: 14,
  backgroundColor: "#0ea5e9",
  borderRadius: 10,
};
const btnt = { color: "#fff", fontWeight: "700" };

export function ForegroundKeepAliveToggle() {
  const [on, setOn] = React.useState(false);
  React.useEffect(() => {}, []);
  async function toggle(v) {
    setOn(v);
    if (v) {
      RNFSvc.start({
        id: 4242,
        title: "See It Through",
        message: "Keeping reminders ultra-reliable",
        importance: "low",
      });
    } else {
      RNFSvc.stopAll();
    }
  }
  return (
    <View
      style={{
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
      }}
    >
      <Text style={{ fontWeight: "700" }}>Keep alive in background</Text>
      <Switch value={on} onValueChange={toggle} />
    </View>
  );
}

/* ===== Styles ===== */
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6F8" },

  /* Top bar */
  topbar: {
    marginTop: -30,
    paddingTop: 48,
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  topBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  topTitle: { fontSize: 20, fontWeight: "800", color: "#111827" },

  container: { paddingHorizontal: 16, paddingBottom: 24, gap: 14 },

  /* Card */
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardHeaderL: { flexDirection: "row", alignItems: "center", gap: 10 },
  cardIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },

  /* Labels */
  label: { color: "#6B7280", fontSize: 12, marginTop: 4, marginBottom: 6 },

  /* Chips */
  rowWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
  },
  chipOn: { backgroundColor: "#111827" },
  chipTxt: { color: "#111827", fontWeight: "700" },
  chipTxtOn: { color: "#FFFFFF" },
  moreChip: {
    backgroundColor: "#EDE9FE",
    borderColor: "#C4B5FD",
    borderWidth: 1,
  },

  /* Window inputs */
  windowRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 2,
  },
  inputBox: { flex: 1 },
  inputLbl: { color: "#6B7280", fontSize: 11, marginBottom: 6 },
  input: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 12,
    height: 44,
    color: "#111827",
  },

  /* Toggles */
  toggleRow: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#EEF1F6",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  toggleLabel: { color: "#111827", fontWeight: "700" },

  /* Buttons */
  btnRow: { flexDirection: "row", gap: 10, marginTop: 6, flexWrap: "wrap" },
  primaryBtn: {
    backgroundColor: "#111827",
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryBtnTxt: { color: "#FFFFFF", fontWeight: "800" },
  secondaryBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  secondaryBtnTxt: { color: "#111827", fontWeight: "700" },
  ghostBtn: {
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ghostBtnTxt: { color: "#111827", fontWeight: "700" },

  /* Pro badge */
  proBadge: {
    marginTop: 6,
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    padding: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  proBadgeTxt: { color: "#065F46", fontWeight: "700", flex: 1 },

  /* Helper */
  help: { marginTop: 10, color: "#6B7280", fontSize: 12 },

  /* ===== Keep-Alive + Permission Cards ===== */
  keepAliveCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
    borderWidth: 1,
    borderColor: "#EEF1F6",
    marginTop: 6,
  },

  helperMuted: { marginTop: 6, color: "#6B7280", fontSize: 12 },

  permissionCard: {
    marginTop: 12,
    backgroundColor: "#FFFBEA",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    padding: 14,
  },

  permissionTitle: {
    fontWeight: "800",
    fontSize: 16,
    color: "#111827",
    marginBottom: 8,
  },

  permissionBody: {
    fontSize: 14,
    color: "#1F2937",
    opacity: 0.9,
    marginBottom: 10,
    lineHeight: 20,
  },

  permissionBtn: {
    backgroundColor: "#111827",
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  permissionBtnTxt: { color: "#FFFFFF", fontWeight: "800", fontSize: 14 },

  permissionHint: {
    marginTop: 10,
    color: "#6B7280",
    fontSize: 12,
  },
});
