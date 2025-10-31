// screens/HomeScreen.js
import React, {
  useMemo,
  useState,
  memo,
  useEffect,
  useCallback,
  useRef,
} from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  SafeAreaView,
  Alert,
  Platform,
  ToastAndroid,
  AppState,
  Share,
  StyleSheet,
  Modal,
  RefreshControl,
  // lastSync,
} from "react-native";
import { Ionicons, Feather } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Swipeable } from "react-native-gesture-handler";

import { isPaid, onProChange } from "../src/payments/store";
import { useInterstitialEveryThirdOpen } from "../src/ads";
import { on } from "../src/events/bus";
import { loadTasks, saveTasks, loadSettings } from "../src/storage/tasks";
import { cancelTaskNotifications } from "../src/notifications/scheduler";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

import { ensureDeviceIdentity } from "../src/push/registerFCM";
import { toggleTaskDoneOnServer } from "../src/push/api";
import { syncTasksToServer } from "../src/push/syncApi";
import { hasDonationBadge, getDonationPhrase } from "../src/pro/donationBadge";

/* ------------- utils ------------- */

const CATEGORY = { PRIORITY: "PRIORITY", ADDITIONAL: "ADDITIONAL" };

const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};

const TAGS = [
  { label: "Errands", value: "ERRANDS", color: "#3B82F6" },
  { label: "Family", value: "FAMILY", color: "#F97316" },
  { label: "Finance", value: "FINANCE", color: "#10B981" },
  { label: "Fitness", value: "FITNESS", color: "#EF4444" },
  { label: "Health", value: "HEALTH", color: "#8B5CF6" },
  { label: "Home", value: "HOME", color: "#22C55E" },
  { label: "Mental Wellness", value: "MENTAL_WELLNESS", color: "#06B6D4" },
  { label: "Side-Hustle", value: "SIDE_HUSTLE", color: "#EAB308" },
  { label: "Work", value: "WORK", color: "#0EA5E9" },
  { label: "PRIORITY", value: "PRIORITY", color: "#E02424" },
  { label: "ADDITIONAL", value: "ADDITIONAL", color: "#3B82F6" },
];
const TAGS_MAP = Object.fromEntries(TAGS.map((t) => [t.value, t]));

const hexToRgba = (hex, alpha = 0.14) => {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || "#9CA3AF");
  const r = parseInt(m?.[1] || "9c", 16);
  const g = parseInt(m?.[2] || "a3", 16);
  const b = parseInt(m?.[3] || "af", 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const STOP = new Set([
  "the",
  "a",
  "an",
  "and",
  "or",
  "to",
  "for",
  "of",
  "on",
  "in",
  "at",
  "by",
  "is",
  "are",
  "be",
  "with",
  "from",
  "this",
  "that",
  "your",
  "my",
  "our",
  "vs",
  "into",
  "up",
  "out",
  "as",
  "it",
]);

function useDebounced(value, delay = 180) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setV(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return v;
}

/* ------------- Header ------------- */

const ListHeader = memo(function ListHeader({
  dateStr,
  topCount,
  activeTab,
  query,
  setQuery,
  tasks,
  autoTags,
  setActiveTab,
  navigation,
  onPressAdd,
  // NEW
  catCountsSorted,
  selectedFilters,
  onOpenFilter,
  onClearFilters,
  lastSync,
  showThanks,
  badgeText,
}) {
  const handleShare = async () => {
    try {
      const message = `I have ${topCount} tasks for today! Check out "See It Through" & be disciplined.`;
      await Share.share({ message });
    } catch {}
  };

  return (
    <>
      {/* Top bar */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.hello}>See-It-Through</Text>
        </View>
        <TouchableOpacity
          style={styles.menuBtn}
          onPress={() => navigation.openDrawer()}
        >
          <Ionicons name="menu-outline" size={22} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.heroTab}>
          <Ionicons name="calendar-outline" size={14} color="#0B48E5" />
          <Text style={styles.heroTabText}>{dateStr}</Text>
        </View>

        <Text style={styles.heroLabel}>Current tasks</Text>
        {showThanks ? (
          <View style={styles.thanksBadge}>
            <Text style={styles.thanksText}>{badgeText}</Text>
          </View>
        ) : null}
        <View style={styles.heroRow}>
          <Text style={styles.heroTitle}>
            You have <Text style={{ fontWeight: "900" }}>{topCount}</Text>
            {"\n"}tasks for{" "}
            {activeTab === "ALL" ? "today" : activeTab.toLowerCase()}
          </Text>
          <View style={styles.highBadge}>
            <Text style={styles.highBadgeText}>
              {tasks.some((t) => t.cat === "PRIORITY" && !t.done)
                ? "Don't Give Up"
                : "Keep it Up"}
            </Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {autoTags.map((t, index) => (
            <View key={index} style={styles.tagChip}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-social" size={18} color="#111827" />
          <Text style={styles.shareText}>—</Text>
        </TouchableOpacity>
        {lastSync && (
          <Text
            style={{
              color: "#cececeff",
              fontSize: 11,
              marginTop: 8,
              marginBottom: -12,
            }}
          >
            Last sync: {lastSync.toLocaleTimeString()}
          </Text>
        )}
      </View>

      {/* Search */}
      <View style={styles.searchRow}>
        <View style={styles.searchBox}>
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Search Here..."
            placeholderTextColor="#9CA3AF"
            style={styles.searchInput}
            returnKeyType="search"
          />
        </View>
        <TouchableOpacity style={styles.searchBtn}>
          <Ionicons name="search" size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      {/* --- Categories (TOP) --- */}
      <FlatList
        data={catCountsSorted}
        horizontal
        keyExtractor={(it) => it.value}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingVertical: 6, paddingBottom: 6 }}
        ItemSeparatorComponent={() => <View style={{ width: 10 }} />}
        renderItem={({ item }) => {
          const isActive = activeTab === item.value;
          const color = TAGS_MAP[item.value]?.color || "#9CA3AF";
          return (
            <TouchableOpacity
              onPress={() => setActiveTab(item.value)}
              activeOpacity={0.9}
              style={{
                minWidth: 140,
                borderRadius: 18,
                paddingVertical: 12,
                paddingHorizontal: 14,
                borderWidth: 1.5,
                borderColor: isActive ? color : "#E5E7EB",
                backgroundColor: isActive ? hexToRgba(color, 0.14) : "#FFFFFF",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: isActive ? 0.08 : 0,
                shadowRadius: 6,
                shadowOffset: { width: 0, height: 3 },
                elevation: isActive ? 2 : 0,
              }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      marginRight: 8,
                      backgroundColor: color,
                    }}
                  />
                  <Text
                    numberOfLines={1}
                    style={{
                      fontWeight: "900",
                      color: isActive ? color : "#111827",
                      fontSize: 14,
                      maxWidth: 120,
                    }}
                  >
                    {item.label}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: isActive ? color : "#111827",
                    borderRadius: 999,
                    paddingHorizontal: 10,
                    paddingVertical: 4,
                  }}
                >
                  <Text
                    style={{
                      color: "#FFFFFF",
                      fontWeight: "900",
                      fontSize: 11,
                    }}
                  >
                    {String(item.count).padStart(2, "0")}
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        style={{ marginBottom: 12 }}
      />

      {/* --- All | Filter (BOTTOM) --- */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          marginBottom: 10,
          gap: 10,
        }}
      >
        <TouchableOpacity
          onPress={() => setActiveTab("ALL")}
          style={{
            backgroundColor: activeTab === "ALL" ? "#111827" : "#FFFFFF",
            borderColor: "#E5E7EB",
            borderWidth: 1,
            paddingVertical: 8,
            paddingHorizontal: 14,
            borderRadius: 999,
          }}
        >
          <Text
            style={{
              color: activeTab === "ALL" ? "#FFFFFF" : "#111827",
              fontWeight: "800",
              fontSize: 13,
            }}
          >
            ALL
          </Text>
        </TouchableOpacity>

        {selectedFilters.length === 0 ? (
          <TouchableOpacity
            onPress={onOpenFilter}
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              borderColor: "#E5E7EB",
              borderWidth: 1,
              paddingVertical: 8,
              paddingHorizontal: 14,
              borderRadius: 999,
            }}
          >
            <Ionicons name="funnel-outline" size={16} color="#111827" />
            <Text
              style={{
                marginLeft: 8,
                color: "#111827",
                fontWeight: "800",
                fontSize: 13,
              }}
            >
              Filter
            </Text>
          </TouchableOpacity>
        ) : (
          <View
            style={{
              marginLeft: "auto",
              flexDirection: "row",
              alignItems: "center",
            }}
          >
            <TouchableOpacity
              onPress={onClearFilters}
              style={{
                flexDirection: "row",
                alignItems: "center",
                backgroundColor: "#FFFFFF",
                borderColor: "#E5E7EB",
                borderWidth: 1,
                paddingVertical: 8,
                paddingHorizontal: 14,
                borderRadius: 999,
              }}
            >
              <Text
                style={{ color: "#111827", fontWeight: "800", fontSize: 13 }}
              >
                {selectedFilters.length} selected
              </Text>
              <Ionicons
                name="close"
                size={16}
                color="#111827"
                style={{ marginLeft: 8 }}
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Section header */}
      <View style={[styles.sectionRow, { marginTop: 6 }]}>
        <Text style={styles.sectionTitle}>Active Tasks</Text>
        <TouchableOpacity onPress={onPressAdd}>
          <Text style={styles.seeAll}>Add Task</Text>
        </TouchableOpacity>
      </View>
    </>
  );
});

/* ------------- Row (perf) ------------- */

const RowInner = memo(function RowInner({
  item,
  onEdit,
  confirmDelete,
  toggleDone,
}) {
  return (
    <TouchableOpacity
      onLongPress={() => confirmDelete(item.id)}
      activeOpacity={0.9}
      style={[
        styles.taskCard,
        item.done && styles.taskCardCompleted,
        { overflow: "visible" },
      ]}
    >
      {item.done &&
        (Platform.OS === "ios" ? (
          <BlurView
            intensity={25}
            tint="light"
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        ) : (
          <LinearGradient
            colors={["rgba(255,255,255,0.30)", "rgba(255,255,255,0.12)"]}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />
        ))}

      {item.done && <View style={styles.leftStripe} />}

      {/* checkbox */}
      <TouchableOpacity
        onPress={() => toggleDone(item.id, !item.done)}
        activeOpacity={0.7}
        style={[
          styles.checkbox,
          item.done && {
            backgroundColor: "#6B7280",
            borderColor: "#6B7280",
            opacity: 0.6,
          },
        ]}
      >
        {item.done ? (
          <Ionicons name="checkmark" size={18} color="#FFFFFF" />
        ) : null}
      </TouchableOpacity>

      {/* row content */}
      <View
        style={{
          flex: 1,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "flex-start",
        }}
      >
        <View style={{ flexShrink: 1, paddingRight: 8 }}>
          <Text
            style={[styles.taskTitle, item.done && styles.taskTitleCompleted]}
          >
            {item.title}
          </Text>
          <Text
            style={[styles.taskWhy, item.done && styles.taskWhyCompleted]}
            numberOfLines={1}
          >
            {item.why}
          </Text>

          {item.done && (
            <View
              style={[
                styles.completedChip,
                { marginTop: 6, alignSelf: "flex-start" },
              ]}
            >
              <Ionicons name="checkmark-done" size={12} color="#374151" />
              <Text style={styles.completedChipText}>Completed</Text>
            </View>
          )}
        </View>

        {/* badge */}
        <View style={{ alignItems: "flex-end" }}>
          {(() => {
            const label =
              item.catLabel ||
              TAGS_MAP[item.cat]?.label ||
              item.customCat ||
              item.customTag ||
              (item.cat === CATEGORY.PRIORITY
                ? "Priority"
                : item.cat === CATEGORY.ADDITIONAL
                ? "Additional"
                : "Category");

            const color =
              item.catColor ||
              TAGS_MAP[item.cat]?.color ||
              (item.cat === CATEGORY.PRIORITY
                ? "#E02424"
                : item.cat === CATEGORY.ADDITIONAL
                ? "#3B82F6"
                : "#9CA3AF");

            const bg = hexToRgba(color, 0.14);

            return (
              <View
                style={[
                  styles.badge,
                  item.done
                    ? { backgroundColor: "#F3F4F6", borderColor: "#9CA3AF" }
                    : { backgroundColor: bg, borderColor: color },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    item.done ? { color: "#4B5563" } : { color },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })()}
        </View>
      </View>
    </TouchableOpacity>
  );
});

const TaskRow = memo(function TaskRow({
  item,
  onEdit,
  confirmDelete,
  toggleDone,
}) {
  if (item.done) {
    const RightActionsDone = () => (
      <TouchableOpacity
        style={[styles.swipeEdit, { backgroundColor: "#10B981" }]}
        onPress={() => toggleDone(item.id, false)}
      >
        <Ionicons name="refresh" size={22} color="#FFFFFF" />
        <Text style={styles.swipeEditText}>Uncomplete</Text>
      </TouchableOpacity>
    );
    return (
      <Swipeable
        renderRightActions={RightActionsDone}
        overshootLeft={false}
        overshootRight={false}
        rightThreshold={28}
        friction={2}
        enableTrackpadTwoFingerGesture
      >
        <RowInner
          item={item}
          onEdit={onEdit}
          confirmDelete={confirmDelete}
          toggleDone={toggleDone}
        />
      </Swipeable>
    );
  }

  const LeftActions = () => (
    <TouchableOpacity
      style={[styles.swipeEdit, { overflow: "visible" }]}
      onPress={() => onEdit(item)}
    >
      <Ionicons name="create-outline" size={22} color="#FFFFFF" />
      <Text style={styles.swipeEditText}>Edit</Text>
    </TouchableOpacity>
  );

  const RightActions = () => (
    <TouchableOpacity
      style={[styles.swipeDelete, { overflow: "visible" }]}
      onPress={() => confirmDelete(item.id)}
    >
      <Ionicons name="trash-outline" size={22} color="#FFFFFF" />
      <Text style={styles.swipeDeleteText}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable
      renderLeftActions={LeftActions}
      renderRightActions={RightActions}
      overshootLeft={false}
      overshootRight={false}
      leftThreshold={28}
      rightThreshold={28}
      friction={2}
      enableTrackpadTwoFingerGesture
    >
      <RowInner
        item={item}
        onEdit={onEdit}
        confirmDelete={confirmDelete}
        toggleDone={toggleDone}
      />
    </Swipeable>
  );
});

/* ------------- Screen ------------- */

export default function HomeScreen() {
  const navigation = useNavigation();

  const [paid, setPaid] = useState(isPaid());
  useEffect(() => onProChange(setPaid), []);
  useInterstitialEveryThirdOpen(!paid);

  const dateStr = useMemo(() => {
    const d = new Date();
    const weekday = d.toLocaleDateString("en-US", { weekday: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    return `${day} ${weekday}`;
  }, []);

  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 180);

  const [tasks, setTasks] = useState([]);
  const [activeTab, setActiveTab] = useState("ALL");
  const [settings, setSettings] = useState(null);

  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState([]);

  const [refreshing, setRefreshing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  const refreshInFlightRef = useRef(false);
  const lastRefreshAtRef = useRef(0);
  const MIN_GAP_MS = 3000; // 3s

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  const fullRefresh = useCallback(
    async (source = "manual") => {
      const now = Date.now();
      if (refreshInFlightRef.current) return;
      if (now - lastRefreshAtRef.current < MIN_GAP_MS) return;

      refreshInFlightRef.current = true;
      lastRefreshAtRef.current = now;
      setRefreshing(true);
      const t0 = Date.now();

      try {
        try {
          await ensureDeviceIdentity();
        } catch {}

        try {
          await syncTasksToServer();
        } catch {}

        const [latestTasks, latestSettings] = await Promise.all([
          loadTasks().catch(() => []),
          loadSettings().catch(() => null),
        ]);
        setTasks(Array.isArray(latestTasks) ? latestTasks : []);
        setSettings(latestSettings || null);

        try {
          await refreshDonationBadge();
        } catch {}

        setLastSync(new Date());
      } finally {
        const spent = Date.now() - t0;
        if (spent < 200) await sleep(200 - spent);
        setRefreshing(false);
        refreshInFlightRef.current = false;
      }
    },
    [refreshDonationBadge]
  );

  useEffect(() => {
    (async () => {
      const [t, s] = await Promise.all([loadTasks(), loadSettings()]);
      setTasks(t || []);
      setSettings(s || null);
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const [t, s] = await Promise.all([loadTasks(), loadSettings()]);
      setTasks(t || []);
      setSettings(s || null);
      fullRefresh("boot");
    })();
  }, [fullRefresh]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") fullRefresh("foreground");
    });
    return () => sub.remove();
  }, [fullRefresh]);

  const onRefresh = useCallback(() => {
    fullRefresh("pull_to_refresh");
  }, [fullRefresh]);

  useEffect(() => {
    const off = on("TASKS_UPDATED", async () => {
      try {
        const latest = await loadTasks();
        setTasks(latest || []);
      } catch {}
    });
    return off;
  }, []);

  const lastSettingsKeyRef = useRef(null);
  useFocusEffect(
    useCallback(() => {
      let mounted = true;
      (async () => {
        const s = await loadSettings();
        const nextKey = JSON.stringify(s || {});
        if (mounted && nextKey !== lastSettingsKeyRef.current) {
          lastSettingsKeyRef.current = nextKey;
          setSettings(s || null);
        }
      })();
      return () => {
        mounted = false;
      };
    }, [])
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", async (s) => {
      if (s === "active") {
        const latest = await loadTasks();
        setTasks(latest || []);
      }
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const [showThanks, setShowThanks] = useState(false);
  const [badgeText, setBadgeText] = useState("❤️ Donor");

  const refreshDonationBadge = useCallback(async () => {
    try {
      const ok = await hasDonationBadge();
      setShowThanks(!!ok);
      if (ok) {
        const phrase = await getDonationPhrase();
        setBadgeText(phrase);
      }
    } catch {}
  }, []);

  useEffect(() => {
    refreshDonationBadge();
  }, [refreshDonationBadge]);

  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "active") refreshDonationBadge();
    });
    return () => sub.remove();
  }, [refreshDonationBadge]);

  const catCountsSorted = useMemo(() => {
    const counts = {};
    for (const t of tasks) {
      const key = t.cat || "UNCATEGORIZED";
      const inc = t.done ? 0 : 1;
      counts[key] = (counts[key] || 0) + inc;
    }
    const entries = Object.entries(counts)
      .map(([value, count]) => ({
        value,
        count,
        label:
          TAGS_MAP[value]?.label ||
          value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
    return entries;
  }, [tasks]);

  const filteredByTab = useMemo(() => {
    let list = tasks;
    if (activeTab !== "ALL") {
      list = list.filter((t) => (t.cat || "UNCATEGORIZED") === activeTab);
    }
    if (selectedFilters.length > 0) {
      const set = new Set(selectedFilters);
      list = list.filter((t) => set.has(t.cat || "UNCATEGORIZED"));
    }
    return list;
  }, [tasks, activeTab, selectedFilters]);

  const visibleTasks = useMemo(() => {
    let list = filteredByTab;
    const q = debouncedQuery.trim().toLowerCase();
    if (q)
      list = list.filter((t) =>
        (t.title + " " + t.why).toLowerCase().includes(q)
      );
    return [...list].sort((a, b) => Number(a.done) - Number(b.done));
  }, [filteredByTab, debouncedQuery]);

  const topCount = useMemo(() => {
    const n = debouncedQuery ? visibleTasks.length : filteredByTab.length;
    return String(n).padStart(2, "0");
  }, [debouncedQuery, visibleTasks.length, filteredByTab.length]);

  const autoTags = useMemo(() => {
    const base = visibleTasks;
    if (base.length === 0) return ["#tasks", "#productivity", "#today"];
    const bag = {};
    for (const t of base.slice(0, 60)) {
      const weight = t.cat === CATEGORY.PRIORITY ? 2 : 1;
      const words = (
        `${t.title} ${t.why}`.toLowerCase().match(/[a-z0-9]+/g) || []
      ).slice(0, 24);
      for (const w of words) {
        if (!STOP.has(w) && w.length >= 3) bag[w] = (bag[w] || 0) + weight;
      }
    }
    const ranked = Object.entries(bag)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([w]) => w);
    return (ranked.length ? ranked : ["tasks", "productivity", "today"])
      .slice(0, 3)
      .map((w) => `#${w}`);
  }, [visibleTasks]);

  // actions
  const toggleDone = async (id, forceState) => {
    const target = tasks.find((t) => t.id === id);
    if (!target) return;

    const goingDone =
      typeof forceState === "boolean" ? forceState : !target.done;

    try {
      if (goingDone) {
        await cancelTaskNotifications(id);
      }
    } catch {}

    const patch = goingDone
      ? { done: true, completedAt: ymdLocal(new Date()) }
      : { done: false, completedAt: null };

    const next = tasks.map((t) => (t.id === id ? { ...t, ...patch } : t));
    setTasks(next);
    try {
      await saveTasks(next);
    } catch {}

    try {
      const { deviceId } = await ensureDeviceIdentity();
      await toggleTaskDoneOnServer({
        deviceId,
        taskId: String(target.id),
        done: goingDone ? 1 : 0,
      });
    } catch (e) {
      console.log("toggleTaskDoneOnServer failed:", e?.message);
    }

    try {
      const msg = goingDone ? "Task completed" : "Marked as incomplete";
      if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    } catch {}
  };

  const notify = (msg) => {
    if (Platform.OS === "android") ToastAndroid.show(msg, ToastAndroid.SHORT);
    else Alert.alert("Notice", msg);
  };

  const deleteById = async (id) => {
    const t = tasks.find((x) => x.id === id);

    try {
      await cancelTaskNotifications(id);
    } catch {}

    try {
      if (t) {
        const { deviceId } = await ensureDeviceIdentity();
        await toggleTaskDoneOnServer({
          deviceId,
          taskId: String(t.id),
          done: 1,
        });
      }
    } catch (e) {
      console.log("server mark-done on delete failed:", e?.message);
    }

    const next = tasks.filter((x) => x.id !== id);
    setTasks(next);
    try {
      await saveTasks(next);
    } catch {}
    if (t) {
      const label =
        t.catLabel ||
        TAGS_MAP[t.cat]?.label ||
        t.customCat ||
        t.customTag ||
        "Category";
      notify(`Task deleted: ${t.title} (${label})`);
    }
  };

  const confirmDelete = (id) => {
    Alert.alert("Delete Task", "Are you sure you want to delete this task?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteById(id) },
    ]);
  };

  const onEdit = (t) => {
    navigation.navigate("AddTask", {
      task: t,
      onSave: async (updated) => {
        const next = tasks.map((x) => (x.id === updated.id ? updated : x));
        setTasks(next);
        try {
          await saveTasks(next);
        } catch {}
      },
    });
  };

  const addTask = async (newTask) => {
    const next = [newTask, ...tasks];
    setTasks(next);
    try {
      await saveTasks(next);
    } catch {}
  };

  const availableCats = useMemo(() => {
    const s = new Set(tasks.map((t) => t.cat || "UNCATEGORIZED"));
    const arr = [...s].map((value) => ({
      value,
      label:
        TAGS_MAP[value]?.label ||
        value.replace(/_/g, " ").replace(/\b\w/g, (m) => m.toUpperCase()),
      color: TAGS_MAP[value]?.color || "#9CA3AF",
    }));
    return arr.sort((a, b) => a.label.localeCompare(b.label));
  }, [tasks]);

  const toggleFilterValue = (value) => {
    setSelectedFilters((prev) => {
      const has = prev.includes(value);
      if (has) return prev.filter((v) => v !== value);
      return [...prev, value];
    });
  };

  const clearFilters = () => setSelectedFilters([]);

  const keyExtractor = useCallback((t) => String(t.id), []);
  const renderItem = useCallback(
    ({ item }) => (
      <TaskRow
        item={item}
        onEdit={onEdit}
        confirmDelete={confirmDelete}
        toggleDone={toggleDone}
      />
    ),
    [onEdit, confirmDelete, toggleDone]
  );
  const listExtra = useMemo(
    () => ({ showThanks, badgeText }),
    [showThanks, badgeText]
  );
  return (
    <SafeAreaView style={styles.root}>
      <FlatList
        data={visibleTasks}
        keyExtractor={keyExtractor}
        renderItem={renderItem}
        // extraData={{ showThanks, badgeText }}
        extraData={listExtra}
        // refreshing={refreshing}
        // onRefresh={onRefresh}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            // Android spinner color(s)
            colors={["#2F66FF"]}
            // iOS spinner color
            tintColor="#2F66FF"
            progressBackgroundColor="#FFFFFF"
          />
        }
        ListHeaderComponent={
          <ListHeader
            dateStr={dateStr}
            topCount={String(
              debouncedQuery ? visibleTasks.length : filteredByTab.length
            ).padStart(2, "0")}
            activeTab={activeTab}
            query={query}
            setQuery={setQuery}
            tasks={tasks}
            autoTags={autoTags}
            setActiveTab={setActiveTab}
            navigation={navigation}
            onPressAdd={() => navigation.navigate("AddTask", { addTask })}
            catCountsSorted={catCountsSorted}
            selectedFilters={selectedFilters}
            onOpenFilter={() => setFilterOpen(true)}
            onClearFilters={clearFilters}
            lastSync={lastSync}
            showThanks={showThanks}
            badgeText={badgeText}
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        contentContainerStyle={{ paddingBottom: 120, paddingHorizontal: 0 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="always"
        removeClippedSubviews={true}
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={16}
        windowSize={7}
      />

      {/* Filter modal */}
      <Modal
        visible={filterOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setFilterOpen(false)}
      >
        <TouchableOpacity
          activeOpacity={1}
          style={{
            flex: 1,
            backgroundColor: "rgba(0,0,0,0.35)",
            justifyContent: "flex-end",
            padding: 18,
          }}
          onPressOut={() => setFilterOpen(false)}
        >
          <View
            style={{
              backgroundColor: "#FFFFFF",
              borderRadius: 16,
              padding: 14,
              maxHeight: "65%",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 10,
              }}
            >
              <Text
                style={{ color: "#111827", fontWeight: "800", fontSize: 16 }}
              >
                Filter by categories
              </Text>
              <TouchableOpacity onPress={() => setFilterOpen(false)}>
                <Ionicons name="close" size={20} color="#111827" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={availableCats}
              keyExtractor={(it) => it.value}
              ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
              renderItem={({ item }) => {
                const selected = selectedFilters.includes(item.value);
                return (
                  <TouchableOpacity
                    onPress={() => toggleFilterValue(item.value)}
                    style={{
                      flexDirection: "row",
                      alignItems: "center",
                      paddingVertical: 12,
                      paddingHorizontal: 12,
                      borderRadius: 12,
                      borderWidth: 1,
                      borderColor: selected ? item.color : "#E5E7EB",
                      backgroundColor: selected
                        ? hexToRgba(item.color, 0.12)
                        : "#FFFFFF",
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        marginRight: 10,
                        backgroundColor: item.color,
                      }}
                    />
                    <Text
                      style={{
                        color: "#111827",
                        fontSize: 14,
                        fontWeight: "700",
                        flex: 1,
                      }}
                    >
                      {item.label}
                    </Text>
                    {selected ? (
                      <Ionicons name="checkmark" size={18} color={item.color} />
                    ) : null}
                  </TouchableOpacity>
                );
              }}
            />

            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                marginTop: 12,
              }}
            >
              <TouchableOpacity
                onPress={clearFilters}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  borderWidth: 1,
                  borderColor: "#E5E7EB",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#111827" }}>
                  Clear
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setFilterOpen(false)}
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 10,
                  backgroundColor: "#111827",
                }}
              >
                <Text style={{ fontWeight: "800", color: "#FFFFFF" }}>
                  Apply
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Dock */}
      <View style={styles.dock}>
        <TouchableOpacity style={styles.dockItem}>
          <Ionicons name="home-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => navigation.navigate("Calendar")}
        >
          <Feather name="calendar" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.fab}
          onPress={() => navigation.navigate("AddTask", { addTask })}
        >
          <Ionicons name="add" size={28} color="#111827" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => navigation.navigate("Analysis")}
        >
          <Feather name="bar-chart-2" size={20} color="#6B7280" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.dockItem}
          onPress={() => navigation.navigate("Settings")}
        >
          <Ionicons name="settings-outline" size={20} color="#6B7280" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

/* ---------- Styles ---------- */
const RADIUS = 18;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "transparent",
    marginTop: -20,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginTop: 26,
    marginBottom: 12,
  },
  hello: { color: "#111827", fontSize: 24, fontWeight: "700" },
  name: { color: "#10182a", fontSize: 22, fontWeight: "800", lineHeight: 26 },
  menuBtn: {
    backgroundColor: "#FFFFFF",
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    elevation: 2,
  },
  hero: {
    backgroundColor: "#2F66FF",
    borderRadius: RADIUS,
    padding: 16,
    paddingBottom: 22,
    marginBottom: 14,
    position: "relative",
  },
  heroTab: {
    position: "absolute",
    top: -10,
    left: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    elevation: 3,
  },
  heroTabText: { color: "#0B48E5", fontWeight: "800", fontSize: 12 },
  heroLabel: {
    color: "#CFE0FF",
    fontSize: 12,
    fontWeight: "700",
    marginTop: 6,
  },
  heroRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "700",
    marginTop: 4,
    lineHeight: 26,
  },
  highBadge: {
    backgroundColor: "#111827",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    alignSelf: "flex-start",
  },
  highBadgeText: { color: "#FFFFFF", fontWeight: "800", fontSize: 10 },
  tagsRow: { flexDirection: "row", gap: 8, marginTop: 10 },
  tagChip: {
    backgroundColor: "#1E4DE8",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
  },
  tagText: { color: "#E2E8F0", fontSize: 12, fontWeight: "600" },
  smallAdd: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 16,
  },
  searchBox: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    height: 46,
    justifyContent: "center",
  },
  searchInput: { color: "#111827", fontSize: 14 },
  searchBtn: {
    width: 46,
    height: 46,
    borderRadius: 12,
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 12, marginBottom: 12 },
  statCard: { flex: 1, borderRadius: 16, padding: 14, minHeight: 120 },
  statCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statTitle: { fontSize: 13, fontWeight: "700" },
  statPct: { fontSize: 26, fontWeight: "900", marginTop: 8 },
  statSub: { fontSize: 12, marginTop: 2 },
  sectionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: { color: "#111827", fontSize: 16, fontWeight: "800" },
  seeAll: { color: "#6B7280", fontWeight: "700", fontSize: 12 },
  tabsRow: { flexDirection: "row", gap: 8, marginVertical: 10 },
  tabChip: {
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  tabText: { color: "#111827", fontWeight: "700", fontSize: 12 },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#111827",
    backgroundColor: "#111827",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  taskTitle: {
    color: "#111827",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 2,
  },
  taskWhy: { color: "#6B7280", fontSize: 12 },
  badge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: "flex-start",
  },
  badgeText: { fontSize: 11, fontWeight: "700" },
  swipeDelete: {
    backgroundColor: "#DC2626",
    width: 84,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  swipeDeleteText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 4,
  },
  dock: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 28,
    height: 64,
    backgroundColor: "#111827",
    borderRadius: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 10,
  },
  dockItem: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: -28,
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
  shareButton: {
    color: "#000000ff",
    position: "absolute",
    bottom: 10,
    right: 10,
    backgroundColor: "#0B48E5",
    padding: 7,
    borderRadius: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  shareText: { color: "#000000ff" },
  swipeEdit: {
    backgroundColor: "#2563EB",
    width: 84,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginVertical: 2,
  },
  swipeEditText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 12,
    marginTop: 4,
  },
  completedPill: {
    marginTop: 6,
    alignSelf: "flex-start",
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#10B981",
    backgroundColor: "rgba(16,185,129,0.12)",
  },
  completedPillText: {
    color: "#065F46",
    fontSize: 11,
    fontWeight: "800",
  },
  // ✅ gray look
  taskCardCompleted: {
    backgroundColor: "rgba(107,114,128,0.07)", // soft gray tint
    borderColor: "rgba(107,114,128,0.28)",
  },

  leftStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 5,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: "#6B7280", // gray stripe
    opacity: 0.9,
  },

  taskTitleCompleted: {
    color: "#374151",
    textDecorationLine: "line-through",
  },

  taskWhyCompleted: {
    color: "#9CA3AF",
  },

  completedChip: {
    marginLeft: -9,
    marginBottom: -4,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.55)",
    backgroundColor: "rgba(107,114,128,0.14)",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },

  completedChipText: {
    color: "#374151",
    fontSize: 8,
    fontWeight: "700",
  },

  seal: {
    marginLeft: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(107,114,128,0.35)",
    backgroundColor: "rgba(107,114,128,0.14)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  taskCard: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#FAFAFA",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    overflow: "hidden", // ✅ add this
  },
  // --- new ---
  catCard: {
    width: 180,
    minHeight: 120,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
  },

  filterBtn: { flexDirection: "row", alignItems: "center" },

  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderColor: "#E5E7EB",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    marginLeft: "auto",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "flex-end",
    padding: 18,
  },
  modalSheet: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    maxHeight: "65%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  modalTitle: { color: "#111827", fontWeight: "800", fontSize: 16 },
  modalRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  modalLabel: { color: "#111827", fontSize: 14, fontWeight: "700" },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 10 },
  thanksBadge: {
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginTop: 8,
  },
  thanksText: {
    color: "#92400E",
    fontWeight: "700",
  },
});
