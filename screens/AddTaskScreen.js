// screens/AddTaskScreen.js
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
  ScrollView,
  Alert,
  Modal,
  Pressable,
  FlatList,
  Switch,
  Keyboard,
} from "react-native";
import { useFonts } from "expo-font";
import { Ionicons } from "@expo/vector-icons";
import DateTimePicker from "@react-native-community/datetimepicker";

import { ensureDeviceIdentity } from "../src/push/registerFCM";
import { syncTasksToServer } from "../src/push/syncApi";

import { isPaid } from "../src/payments/store";
import { loadTasks, loadSettings, saveTasks } from "../src/storage/tasks";

import { cancelTaskNotifications } from "../src/notifications/scheduler";
import { enforceWindowForTask } from "../src/notifications/windowGate";

import Banner from "../src/ads/Banner";
// import BannerSlot from "../src/ads2/BannerSlot";
import { createOrUpdateTask } from "../src/push/api";
import mobileAds from "react-native-google-mobile-ads";

const TAGS = [
  { label: "Errands", value: "ERRANDS", color: "#3B82F6" }, // blue
  { label: "Family", value: "FAMILY", color: "#F97316" }, // orange
  { label: "Finance", value: "FINANCE", color: "#10B981" }, // green
  { label: "Fitness", value: "FITNESS", color: "#EF4444" }, // red
  { label: "Health", value: "HEALTH", color: "#8B5CF6" }, // violet
  { label: "Home", value: "HOME", color: "#22C55E" }, // emerald
  { label: "Mental Wellness", value: "MENTAL_WELLNESS", color: "#06B6D4" }, // cyan
  { label: "Side-Hustle", value: "SIDE_HUSTLE", color: "#EAB308" }, // yellow
  { label: "Work", value: "WORK", color: "#0EA5E9" }, // sky
  { label: "+Custom", value: "CUSTOM", color: "#64748B" }, // slate
];

const INTENSITIES = ["MILD", "MEDIUM", "AGGRESSIVE"];

const PLACEHOLDER_COLOR = "#9CA3AF";
const TEXT_COLOR = "#111827";
const ACCENT = "#111827";
const BORDER = "#E5E7EB";
const SHEET_BG = "#FFFFFF";
const OVERLAY = "rgba(0,0,0,0.35)";

const pad2 = (n) => String(n).padStart(2, "0");
const to12 = (h24) => {
  const am = h24 < 12;
  let h = h24 % 12;
  if (h === 0) h = 12;
  return { h, am };
};
const to24 = (h12, am) => {
  let h = parseInt(h12, 10);
  if (!h || isNaN(h)) h = 9;
  h = Math.max(1, Math.min(12, h));
  const base = h % 12; // 12 -> 0
  return am ? base : base + 12;
};

const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const INTENSITY_DESC = {
  AGGRESSIVE: "Every 30 min",
  MEDIUM: "Every 3 hours",
  MILD: "Every 12 hours",
};

function formatDate(d) {
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

/* ---------------------------
   Reusable SelectDropdown
--------------------------- */
function SelectDropdown({
  label,
  value,
  placeholder = "Select…",
  options = [],
  onChange,
}) {
  const [open, setOpen] = useState(false);
  const selected = useMemo(
    () => options.find((o) => o.value === value),
    [value, options]
  );
  const ITEM_HEIGHT = 52;
  return (
    <>
      <View style={styles.pickerWrap}>
        {label ? <Text style={styles.pickerLabel}>{label}</Text> : null}

        <Pressable
          onPress={() => {
            Keyboard.dismiss();
            setTimeout(() => setOpen(true), 0);
          }}
          style={({ pressed }) => [
            styles.pickerBox,
            pressed && { opacity: 0.85 },
          ]}
        >
          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 8,
              flex: 1,
            }}
          >
            {selected?.color ? (
              <View
                style={[styles.colorDot, { backgroundColor: selected.color }]}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.pickerText,
                { color: value ? TEXT_COLOR : PLACEHOLDER_COLOR },
              ]}
            >
              {value ? selected?.label ?? "" : placeholder}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color={TEXT_COLOR} />
        </Pressable>
      </View>

      <Modal
        transparent
        visible={open}
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.overlay} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>{label || "Select"}</Text>
            <Pressable style={styles.sheetClose} onPress={() => setOpen(false)}>
              <Ionicons name="close" size={20} color={TEXT_COLOR} />
            </Pressable>
          </View>

          <FlatList
            data={options}
            keyExtractor={(item) => String(item.value)}
            ItemSeparatorComponent={() => <View style={styles.sep} />}
            initialNumToRender={options.length}
            maxToRenderPerBatch={options.length}
            windowSize={options.length}
            removeClippedSubviews={false}
            getItemLayout={(_, index) => ({
              length: ITEM_HEIGHT,
              offset: ITEM_HEIGHT * index,
              index,
            })}
            renderItem={({ item }) => {
              const active = item.value === value;
              return (
                <Pressable
                  onPress={() => {
                    onChange?.(item.value);
                    setOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.optionRow,
                    active && styles.optionActive,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      gap: 10,
                      flex: 1,
                    }}
                  >
                    {item.color ? (
                      <View
                        style={[
                          styles.colorDot,
                          { backgroundColor: item.color },
                        ]}
                      />
                    ) : null}
                    <View style={{ flexDirection: "column", flex: 1 }}>
                      <Text
                        style={[
                          styles.optionText,
                          active && { color: ACCENT, fontWeight: "800" },
                        ]}
                      >
                        {item.label}
                      </Text>
                      {item.desc ? (
                        <Text style={styles.optionSubText}>{item.desc}</Text>
                      ) : null}
                    </View>
                  </View>
                  {active ? (
                    <Ionicons name="checkmark" size={18} color={ACCENT} />
                  ) : null}
                </Pressable>
              );
            }}
          />
        </View>
      </Modal>
    </>
  );
}

export default function AddTaskScreen({ route, navigation }) {
  const promptUpgrade = React.useCallback(() => {
    Alert.alert(
      "Upgrade required",
      "Aggressive reminders are available in paid version.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Unlock Pro", onPress: () => navigation.navigate("UnlockPro") },
      ]
    );
  }, [navigation]);

  async function openAdInspector() {
    try {
      await mobileAds().openAdInspector();
    } catch (e) {
      console.log("AdInspector error:", e);
      Alert.alert("Ad Inspector", e?.message || String(e));
    }
  }
  const { addTask, task, onSave } = route?.params || {};

  const [title, setTitle] = useState("");
  const [why, setWhy] = useState("");
  const [category, setCategory] = useState("");
  const [customCategory, setCustomCategory] = useState("");
  const [intensity, setIntensity] = useState("");

  const [calAwareDefault, setCalAwareDefault] = useState(true);
  const [tone, setTone] = useState("BLUNT");
  const [defaultTone, setDefaultTone] = useState("BLUNT");

  const today = new Date();
  const [dueDate, setDueDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), today.getDate())
  );
  const [showDate, setShowDate] = useState(false);

  const [tStartH12, setTStartH12] = useState(9);
  const [tStartMin, setTStartMin] = useState(0);
  const [tStartAM, setTStartAM] = useState(true);

  const [tEndH12, setTEndH12] = useState(8);
  const [tEndMin, setTEndMin] = useState(0);
  const [tEndAM, setTEndAM] = useState(false);

  const [tStartHRaw, setTStartHRaw] = useState("9");
  const [tStartMinRaw, setTStartMinRaw] = useState("00");
  const [tEndHRaw, setTEndHRaw] = useState("8");
  const [tEndMinRaw, setTEndMinRaw] = useState("00");
  const [submitting, setSubmitting] = useState(false);

  const parseHour12 = (raw, fallback = 9) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 1 || n > 12) return fallback;
    return n;
  };
  const parseMin = (raw) => {
    const n = parseInt(raw, 10);
    if (isNaN(n) || n < 0 || n > 59) return 0;
    return n;
  };

  const getStart24 = () => {
    const h12 = parseHour12(tStartHRaw, tStartH12);
    const m = parseMin(tStartMinRaw);
    setTStartH12(h12);
    setTStartMin(m);
    return { h: to24(h12, tStartAM), m };
  };
  const getEnd24 = () => {
    const h12 = parseHour12(tEndHRaw, tEndH12);
    const m = parseMin(tEndMinRaw);
    setTEndH12(h12);
    setTEndMin(m);
    return { h: to24(h12, tEndAM), m };
  };

  const [deviceId, setDeviceId] = useState(null);
  useEffect(() => {
    (async () => {
      try {
        const { deviceId: did } = await ensureDeviceIdentity();
        setDeviceId(did);
      } catch {}
    })();
  }, []);

  const [fontsReady] = useFonts(Ionicons.font);
  if (!fontsReady) return null;

  useEffect(() => {
    (async () => {
      try {
        const s = await loadSettings();

        setCalAwareDefault(!!s?.calendarAware);
        setDefaultTone(s?.tone || s?.defaultTone || "BLUNT");
        setTone(s?.tone || s?.defaultTone || "BLUNT");

        if (task) return;

        const st = s?.reminderWindow?.start || { h: 9, m: 0 };
        const en = s?.reminderWindow?.end || { h: 20, m: 0 };
        const s12 = to12(st.h),
          e12 = to12(en.h);
        setTStartH12(s12.h);
        setTStartAM(s12.am);
        setTStartMin(st.m || 0);
        setTEndH12(e12.h);
        setTEndAM(e12.am);
        setTEndMin(en.m || 0);
      } catch {}
    })();
  }, [task]);

  const [notifOn, setNotifOn] = useState(true);

  useEffect(() => {
    if (!task) return;
    setNotifOn(task.notificationsEnabled !== false);
    setCategory(task.cat || task.tag || "");
    setCustomCategory(
      task.customCat || task.customCategory || task.customTag || ""
    );

    setTitle(task.title || "");
    setWhy(task.why || "");
    setIntensity(task.intensity || "");
    setTone(task.tone || defaultTone || "BLUNT");

    if (task.dueDate) {
      const [y, m, d] = task.dueDate.split("-").map(Number);
      setDueDate(new Date(y, (m || 1) - 1, d || 1));
    }

    const sM = task.windowStartMins;
    const eM = task.windowEndMins;
    const sObj = task.windowStart;
    const eObj = task.windowEnd;
    const sStr =
      task.windowStartStr || task.windowStartString || task.windowStartTime;
    const eStr =
      task.windowEndStr || task.windowEndString || task.windowEndTime;

    let sh = 9,
      sm = 0,
      eh = 20,
      em = 0;

    if (typeof sM === "number") {
      sh = Math.floor(sM / 60);
      sm = sM % 60;
    } else if (sObj && typeof sObj.h === "number") {
      sh = sObj.h;
      sm = sObj.m || 0;
    } else if (typeof sStr === "string" && sStr.includes(":")) {
      const [H, M] = sStr.split(":").map((n) => parseInt(n, 10));
      if (!isNaN(H) && !isNaN(M)) {
        sh = H;
        sm = M;
      }
    }

    if (typeof eM === "number") {
      eh = Math.floor(eM / 60);
      em = eM % 60;
    } else if (eObj && typeof eObj.h === "number") {
      eh = eObj.h;
      em = eObj.m || 0;
    } else if (typeof eStr === "string" && eStr.includes(":")) {
      const [H, M] = eStr.split(":").map((n) => parseInt(n, 10));
      if (!isNaN(H) && !isNaN(M)) {
        eh = H;
        em = M;
      }
    }

    const s12 = to12(sh),
      e12 = to12(eh);

    setTStartH12(s12.h);
    setTStartAM(s12.am);
    setTStartMin(sm);
    setTEndH12(e12.h);
    setTEndAM(e12.am);
    setTEndMin(em);

    setTStartHRaw(String(s12.h));
    setTStartMinRaw(String(sm).padStart(2, "0"));
    setTEndHRaw(String(e12.h));
    setTEndMinRaw(String(em).padStart(2, "0"));
  }, [task, defaultTone]);

  const onPickDate = (_, d) => {
    setShowDate(false);
    if (d) setDueDate(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
  };

  const handleSubmit = async () => {
    if (submitting) return;
    if (!title.trim()) {
      Alert.alert("Missing", "Please enter task name.");
      return;
    }
    if (!why.trim()) {
      Alert.alert("Missing", "Please add why it matters.");
      return;
    }
    if (!category) {
      Alert.alert("Missing", "Please choose a category.");
      return;
    }
    if (category === "CUSTOM" && !customCategory.trim()) {
      Alert.alert("Missing", "Please type your custom category name.");
      return;
    }
    if (!intensity) {
      Alert.alert("Missing", "Please choose reminder intensity.");
      return;
    }

    const s24 = getStart24();
    const e24 = getEnd24();
    const startMins = s24.h * 60 + s24.m;
    const endMins = e24.h * 60 + e24.m;

    if (endMins <= startMins) {
      Alert.alert("Invalid window", "End time must be after start time.");
      return;
    }

    const paid = isPaid();
    const all = await loadTasks();
    const activeCount = all.filter((t) => !t.done).length;

    if (!paid && activeCount >= 3) {
      Alert.alert(
        "Limit reached",
        "Free Tier can Only have 3 Tasks at a Time, Upgrade for more."
      );
      return;
    }
    if (!paid && intensity === "AGGRESSIVE") {
      promptUpgrade();
      return;
    }

    setSubmitting(true);

    const catMeta = TAGS.find((t) => t.value === category);
    const catColor = catMeta?.color;
    const catLabel =
      catMeta?.label ||
      (category === "CUSTOM" ? customCategory.trim() : undefined);

    const taskId = task ? String(task.id) : Date.now().toString();
    const payload = {
      id: taskId,
      title: title.trim(),
      why: why.trim(),
      cat: category,
      catLabel,
      customCat: category === "CUSTOM" ? customCategory.trim() : "",
      catColor,
      tag: category,
      tagLabel: catLabel,
      customTag: category === "CUSTOM" ? customCategory.trim() : "",
      tagColor: catColor,

      intensity: String(intensity).toUpperCase(),
      dueDate: ymdLocal(dueDate),
      done: false,
      createdAt: task?.createdAt ?? Date.now(),
      calendarAware: calAwareDefault,
      tone,
      windowStartMins: startMins,
      windowEndMins: endMins,
      windowStart: s24,
      windowEnd: e24,
      windowStartStr: `${pad2(s24.h)}:${pad2(s24.m)}`,
      windowEndStr: `${pad2(e24.h)}:${pad2(e24.m)}`,
      notificationsEnabled: !!notifOn,
    };

    let serverResp;
    try {
      serverResp = await createOrUpdateTask({
        device_id: deviceId || (await ensureDeviceIdentity()).deviceId,
        task_id: taskId,
        title: title.trim(),
        why: why.trim(),
        intensity: String(intensity).toUpperCase(),
        window_start_mins: startMins,
        window_end_mins: endMins,
        tone: String(tone).toUpperCase(),
      });
    } catch (e) {
      setSubmitting(false);
      Alert.alert("Network error", String(e?.message || e));
      return;
    }
    if (!serverResp?.ok) {
      setSubmitting(false);
      Alert.alert("Server error", "Task not saved on server.");
      return;
    }

    if (task && typeof onSave === "function") {
      const updated = { ...task, ...payload };
      await onSave(updated);
      await cancelTaskNotifications(String(updated.id));
      setSubmitting(false);
      navigation.goBack();
      return;
    }

    if (typeof addTask === "function") {
      await addTask(payload);
      await cancelTaskNotifications(String(payload.id));
      try {
        const { deviceId, installSecret } = await ensureDeviceIdentity();
        const allNow = await loadTasks();
        await syncTasksToServer({ deviceId, installSecret, tasks: allNow });
      } catch {}
      setSubmitting(false);
      navigation.goBack();
      return;
    }
    try {
      const all = await loadTasks();
      all.push(payload);
      await saveTasks(all);
      if (payload.notificationsEnabled) {
        await cancelTaskNotifications(String(payload.id));
        await enforceWindowForTask({ ...payload, id: String(payload.id) });
      } else {
        await cancelTaskNotifications(String(payload.id));
      }
      try {
        const { deviceId, installSecret } = await ensureDeviceIdentity();
        await syncTasksToServer({ deviceId, installSecret, tasks: all });
      } catch {}
      setSubmitting(false);
      navigation.goBack();
    } catch (e) {
      Alert.alert("Error", "Could not save. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };
  const intensityOptions = [
    {
      label: "Aggressive",
      value: "AGGRESSIVE",
      desc: INTENSITY_DESC.AGGRESSIVE,
    },
    { label: "Medium", value: "MEDIUM", desc: INTENSITY_DESC.MEDIUM },
    { label: "Mild", value: "MILD", desc: INTENSITY_DESC.MILD },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 24 }}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.iconBtn}
        >
          <Ionicons name="chevron-back" size={20} color={TEXT_COLOR} />
        </TouchableOpacity>
        <Text style={styles.title}>Task Creation</Text>
        <TouchableOpacity style={styles.iconBtn}>
          <Ionicons name="add" size={18} color={TEXT_COLOR} />
        </TouchableOpacity>
      </View>

      {/* Task Name */}
      <View style={styles.inputWrap}>
        <TextInput
          value={title}
          onChangeText={setTitle}
          placeholder="Task Name"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
          returnKeyType="next"
        />
      </View>

      {/* Due Date */}
      <TouchableOpacity
        style={styles.fieldRow}
        onPress={() => setShowDate(true)}
      >
        <View style={styles.fieldLeft}>
          <Text style={styles.fieldLabel}>Due Date</Text>
        </View>
        <View style={styles.fieldRight}>
          <Text style={styles.fieldValue}>{formatDate(dueDate)}</Text>
          <Ionicons name="calendar-outline" size={18} color={TEXT_COLOR} />
        </View>
      </TouchableOpacity>
      {showDate && (
        <DateTimePicker
          value={dueDate}
          mode="date"
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={onPickDate}
        />
      )}

      {/* Category (now your 10-tag list) */}
      <SelectDropdown
        label="Category"
        value={category}
        placeholder="Select a category"
        options={TAGS}
        onChange={(v) => {
          setCategory(v);
          if (v !== "CUSTOM") setCustomCategory("");
        }}
      />
      {category === "CUSTOM" ? (
        <View style={styles.inputWrap}>
          <TextInput
            value={customCategory}
            onChangeText={setCustomCategory}
            placeholder="Enter custom category"
            placeholderTextColor={PLACEHOLDER_COLOR}
            style={styles.input}
          />
        </View>
      ) : null}

      {/* Intensity */}
      <SelectDropdown
        label="Reminder Intensity"
        value={intensity}
        placeholder="Select intensity"
        options={intensityOptions}
        onChange={(val) => {
          if (val === "AGGRESSIVE" && !isPaid()) {
            // block and show paywall
            promptUpgrade();
            return;
          }
          setIntensity(val);
        }}
      />

      {Boolean(intensity) ? (
        <Text style={styles.helperNote}>
          {intensity === "AGGRESSIVE" &&
            "Aggressive: task reminders every 30 min"}
          {intensity === "MEDIUM" && "Medium: task reminders every 3 hours"}
          {intensity === "MILD" && "Mild: task reminders every 12 hours"}
        </Text>
      ) : null}

      {/* Tone */}
      {/* <SelectDropdown
        label="Personality Tone"
        value={tone}
        placeholder="Select tone"
        options={[
          { label: "BLUNT", value: "BLUNT" },
          { label: "SUPPORTIVE", value: "SUPPORTIVE" },
          { label: "SPOUSE", value: "SPOUSE" },
          { label: "DRILL", value: "DRILL" },
        ]}
        onChange={(val) => {
          if (val !== "BLUNT" && !isPaid()) {
            Alert.alert(
              "Unlock Pro",
              "BLUNT is free. Get Supportive, Spouse & Drill with Pro Unlock.",
              [
                { text: "Cancel" },
                {
                  text: "Unlock Pro",
                  onPress: () => navigation.navigate("UnlockPro"),
                },
              ]
            );
            return;
          }
          setTone(val);
        }}
      /> */}

      <SelectDropdown
        label="Personality Tone"
        value={tone}
        placeholder="Select tone"
        options={[
          { label: "Blunt", value: "BLUNT" },
          { label: "Supportive", value: "SUPPORTIVE" },
          { label: "Spouse", value: "SPOUSE" },
          { label: "Drill Sergeant", value: "DRILL" },
        ]}
        onChange={(val) => {
          if (val !== "BLUNT" && !isPaid()) {
            Alert.alert(
              "Unlock Pro",
              "BLUNT is free. Get Supportive, Spouse & Drill Sergeant with Pro Unlock.",
              [
                { text: "Cancel" },
                {
                  text: "Unlock Pro",
                  onPress: () => navigation.navigate("UnlockPro"),
                },
              ]
            );
            return;
          }
          setTone(val);
        }}
      />

      {/* Per-Task Reminder Window */}
      <Text style={[styles.pickerLabel, { marginTop: 12 }]}>
        Reminder Window (this task)
      </Text>

      {/* START time */}
      <View style={styles.fieldRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>Start</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 0,
                  width: 54,
                  textAlign: "center",
                  paddingVertical: 10,
                },
              ]}
              keyboardType="number-pad"
              inputMode="numeric"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              value={tStartHRaw}
              placeholder="0"
              placeholderTextColor={PLACEHOLDER_COLOR}
              onChangeText={(v) => {
                const raw = (v || "").replace(/\D/g, "").slice(0, 2);
                setTStartHRaw(raw);
              }}
              maxLength={2}
            />
            <Text style={{ color: "#9CA3AF" }}>:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 0,
                  width: 56,
                  textAlign: "center",
                  paddingVertical: 10,
                },
              ]}
              keyboardType="number-pad"
              inputMode="numeric"
              autoCorrect={false}
              autoComplete="off"
              importantForAutofill="no"
              value={tStartMinRaw}
              placeholder="00"
              placeholderTextColor={PLACEHOLDER_COLOR}
              onChangeText={(v) => {
                const raw = (v || "").replace(/\D/g, "").slice(0, 2);
                setTStartMinRaw(raw);
              }}
              maxLength={2}
            />
            <View style={{ flexDirection: "row", gap: 6, marginLeft: 6 }}>
              <TouchableOpacity
                onPress={() => setTStartAM(true)}
                style={[styles.chipSmall, tStartAM && styles.chipOn]}
              >
                <Text style={[styles.chipTxt, tStartAM && styles.chipTxtOn]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTStartAM(false)}
                style={[styles.chipSmall, !tStartAM && styles.chipOn]}
              >
                <Text style={[styles.chipTxt, !tStartAM && styles.chipTxtOn]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      {/* END time */}
      <View style={styles.fieldRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.fieldLabel}>End</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 0,
                  width: 54,
                  textAlign: "center",
                  paddingVertical: 10,
                },
              ]}
              keyboardType="numeric"
              value={tEndHRaw}
              placeholder="0"
              placeholderTextColor={PLACEHOLDER_COLOR}
              onChangeText={(v) => {
                const raw = (v || "").replace(/\D/g, "").slice(0, 2);
                setTEndHRaw(raw);
              }}
              maxLength={2}
            />
            <Text style={{ color: "#9CA3AF" }}>:</Text>
            <TextInput
              style={[
                styles.input,
                {
                  flex: 0,
                  width: 56,
                  textAlign: "center",
                  paddingVertical: 10,
                },
              ]}
              keyboardType="numeric"
              value={tEndMinRaw}
              placeholder="00"
              placeholderTextColor={PLACEHOLDER_COLOR}
              onChangeText={(v) => {
                const raw = (v || "").replace(/\D/g, "").slice(0, 2);
                setTEndMinRaw(raw);
              }}
              maxLength={2}
            />
            <View style={{ flexDirection: "row", gap: 6, marginLeft: 6 }}>
              <TouchableOpacity
                onPress={() => setTEndAM(true)}
                style={[styles.chipSmall, tEndAM && styles.chipOn]}
              >
                <Text style={[styles.chipTxt, tEndAM && styles.chipTxtOn]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setTEndAM(false)}
                style={[styles.chipSmall, !tEndAM && styles.chipOn]}
              >
                <Text style={[styles.chipTxt, !tEndAM && styles.chipTxtOn]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>

      <Text style={{ color: "#9CA3AF", marginTop: -4, marginBottom: 4 }}>
        Example: 9:00 AM → 8:00 PM
      </Text>

      {/* Why */}
      <View style={styles.inputWrap}>
        <TextInput
          value={why}
          onChangeText={setWhy}
          placeholder="Why does it matter?"
          placeholderTextColor={PLACEHOLDER_COLOR}
          style={styles.input}
        />
      </View>

      <View style={styles.fieldRow}>
        <View style={styles.fieldLeft}>
          <Text style={styles.fieldLabel}>Enable Reminders</Text>
        </View>
        <View style={styles.fieldRight}>
          <Switch
            value={notifOn}
            onValueChange={setNotifOn}
            trackColor={{ false: "#e5e7eb", true: "#a7f3d0" }}
            thumbColor={notifOn ? "#10b981" : "#9ca3af"}
          />
        </View>
      </View>

      <Banner style={{ marginTop: 8 }} />

      <TouchableOpacity
        style={[styles.cta, submitting && { opacity: 0.6 }]}
        onPress={handleSubmit}
        disabled={submitting || !deviceId}
      >
        <Text style={styles.ctaText}>
          {submitting ? "Saving..." : "Lock It In"}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: -30,
    backgroundColor: "#FFFFFF",
    flex: 1,
    padding: 16,
    paddingTop: 12,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
    marginTop: 40,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: { fontWeight: "800", color: TEXT_COLOR, fontSize: 18 },

  inputWrap: { marginVertical: 8 },
  input: {
    backgroundColor: "#FFFFFF",
    color: TEXT_COLOR,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 18,
    paddingVertical: 18,
  },

  fieldRow: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginVertical: 6,
  },
  fieldLeft: { flexDirection: "column" },
  fieldRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  fieldLabel: { color: "#6B7280", fontSize: 12, marginBottom: 4 },
  fieldValue: { color: TEXT_COLOR, fontWeight: "700", marginRight: 8 },

  /* Select styles */
  pickerWrap: { marginTop: 6 },
  pickerLabel: { color: "#6B7280", fontSize: 12, marginBottom: 6 },
  pickerBox: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: "#FFFFFF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: { fontSize: 16 },

  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: OVERLAY,
  },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "60%",
    backgroundColor: SHEET_BG,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: Platform.OS === "ios" ? 24 : 12,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -2 },
    elevation: 14,
    backgroundColor: SHEET_BG,
    borderRadius: 14,
    paddingVertical: 8,
    // width: "92%",
    alignSelf: "center",
    maxHeight: "70%",
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  sheetTitle: { fontSize: 16, fontWeight: "800", color: TEXT_COLOR },
  sheetClose: {
    position: "absolute",
    right: 10,
    top: 4,
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  optionRow: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  optionText: { fontSize: 16, color: TEXT_COLOR },
  optionActive: { backgroundColor: "#F3F4F6" },
  sep: { height: 1, backgroundColor: "#F3F4F6" },

  cta: {
    marginTop: 12,
    backgroundColor: ACCENT,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  ctaText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  chipSmall: {
    backgroundColor: "#F3F4F6",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipOn: { backgroundColor: "#111827", borderColor: "#111827" },
  chipTxt: { color: "#111827", fontWeight: "700", fontSize: 12 },
  chipTxtOn: { color: "#FFFFFF" },
  colorDot: {
    width: 10,
    height: 10,
    borderRadius: 999,
  },
  optionSubText: { fontSize: 12, color: "#6B7280", marginTop: 2 },
  helperNote: { color: "#6B7280", fontSize: 12, marginTop: 6, marginBottom: 4 },
});
