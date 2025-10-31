// CalendarScreen.js — category-aware tiles + completed toggle preserved
import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { loadTasks } from "../src/storage/tasks";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const DOW = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

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
  { label: "Priority", value: "PRIORITY", color: "#E02424" },
  { label: "Additional", value: "ADDITIONAL", color: "#2563EB" },
  { label: "Uncategorized", value: "UNCATEGORIZED", color: "#9CA3AF" },
];
const TAGS_MAP = Object.fromEntries(TAGS.map((t) => [t.value, t]));

const ymdLocal = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${da}`;
};
const parseYmd = (s) => {
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};
const sameDay = (a, b) => ymdLocal(a) === ymdLocal(b);
const formatTime = (ts) => {
  const d = ts ? new Date(ts) : new Date();
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, "0")}:${m} ${ampm}`;
};

function startOfMonth(d) {
  const x = new Date(d);
  x.setDate(1);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfMonth(d) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}
function addMonths(d, n) {
  const x = new Date(d);
  x.setMonth(x.getMonth() + n);
  return x;
}

const dayKeyForTask = (t) => {
  if (t?.dueDate && typeof t.dueDate === "string") return t.dueDate;
  const c = new Date(t?.createdAt || Date.now());
  c.setHours(0, 0, 0, 0);
  return ymdLocal(c);
};

export default function CalendarScreen() {
  const navigation = useNavigation();
  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const [cursor, setCursor] = useState(() => startOfMonth(new Date()));
  const [tasks, setTasks] = useState([]);
  const [selectedDay, setSelectedDay] = useState(ymdLocal(new Date()));
  const [showAll, setShowAll] = useState(true);
  const [expanded, setExpanded] = useState({});
  const [loading, setLoading] = useState(true);

  const [showCompletedOnly, setShowCompletedOnly] = useState(false);

  const reload = useCallback(async () => {
    const all = await loadTasks();
    setTasks(Array.isArray(all) ? all : []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setShowAll(true);
      setShowCompletedOnly(false);
      setLoading(true);
      reload().finally(() => setTimeout(() => setLoading(false), 1000));
    }, [reload])
  );

  const byDay = useMemo(() => {
    const m = new Map();
    for (const t of tasks) {
      const key = dayKeyForTask(t);
      if (!m.has(key)) m.set(key, []);
      m.get(key).push(t);
    }
    return m;
  }, [tasks]);

  const stripDays = useMemo(() => {
    const end = endOfMonth(cursor);
    const out = [];
    for (let d = 1; d <= end.getDate(); d++) {
      const date = new Date(cursor.getFullYear(), cursor.getMonth(), d);
      date.setHours(0, 0, 0, 0);
      const key = ymdLocal(date);
      const has = (byDay.get(key) || []).length > 0;
      const isPast = date < today;
      if (isPast && !has) continue;
      out.push({ key, date, has, isPast });
    }
    return out;
  }, [cursor, byDay, today]);

  const visibleTasks = useMemo(() => {
    if (showAll) {
      const arr = tasks || [];
      if (showCompletedOnly) return arr.filter((t) => !!t?.done);
      return arr.filter((t) => !t?.done);
    }
    return byDay.get(selectedDay) || [];
  }, [showAll, showCompletedOnly, byDay, selectedDay, tasks]);

  const activeMonthLabel = `${
    MONTHS[cursor.getMonth()]
  } ${cursor.getFullYear()}`;

  if (loading) {
    return (
      <SafeAreaView style={S.wrapCenter}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={S.wrap}>
      {/* Header */}
      <View style={S.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={S.navBtn}>
          <Ionicons name="chevron-back" size={20} color="#111827" />
        </TouchableOpacity>

        <View style={S.monthPicker}>
          <TouchableOpacity
            onPress={() => setCursor(addMonths(cursor, -1))}
            style={S.smallNav}
          >
            <Ionicons name="chevron-back" size={16} color="#111827" />
          </TouchableOpacity>
          <Text style={S.monthText}>{activeMonthLabel}</Text>
          <TouchableOpacity
            onPress={() => setCursor(addMonths(cursor, +1))}
            style={S.smallNav}
          >
            <Ionicons name="chevron-forward" size={16} color="#111827" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={S.calendarBtn}
          onPress={() => {
            setSelectedDay(ymdLocal(new Date()));
            setShowAll(true);
            setShowCompletedOnly(false);
          }}
        >
          <Ionicons name="calendar" size={18} color="#111827" />
        </TouchableOpacity>
      </View>

      {/* Date strip */}
      <View style={S.stripContainer}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={S.stripWrap}
        >
          <TouchableOpacity
            onPress={() => {
              setShowAll(true);
              setShowCompletedOnly(false);
            }}
            style={[
              S.pill,
              S.allPill,
              showAll && !showCompletedOnly && { backgroundColor: "#111827" },
            ]}
          >
            <Ionicons
              name="layers"
              size={18}
              color={showAll && !showCompletedOnly ? "#FFFFFF" : "#111827"}
            />
            <Text
              style={[
                S.allTxt,
                showAll && !showCompletedOnly && { color: "#FFFFFF" },
              ]}
            >
              All
            </Text>
          </TouchableOpacity>

          {stripDays.map((it) => {
            const isSelected = !showAll && it.key === selectedDay;
            const isToday = sameDay(it.date, today);

            const baseBg = it.isPast
              ? "#E5E7EB"
              : isToday
              ? "#FFFFFF"
              : "#2563EB";
            const baseTxt = it.isPast
              ? "#6B7280"
              : isToday
              ? "#111827"
              : "#FFFFFF";
            const baseOpacity = it.isPast ? 0.65 : 1;

            const txtCol = isSelected
              ? it.isPast
                ? "#374151"
                : "#212121"
              : baseTxt;
            const borderStyle = isSelected
              ? { borderWidth: 3, borderColor: "#000000ff" }
              : isToday
              ? { borderWidth: 2, borderColor: "#ffffffff" }
              : {};

            return (
              <TouchableOpacity
                key={it.key}
                onPress={() => {
                  setShowAll(false);
                  setSelectedDay(it.key);
                }}
                style={[
                  S.pill,
                  { backgroundColor: baseBg, opacity: baseOpacity },
                  borderStyle,
                ]}
              >
                <Text style={[S.pillDay, { color: txtCol }]}>
                  {String(it.date.getDate()).padStart(2, "0")}
                </Text>
                <Text style={[S.pillMon, { color: txtCol }]}>
                  {MONTHS[it.date.getMonth()].slice(0, 3)}
                </Text>
                {isToday && (
                  <View style={S.todayTag}>
                    <Text style={S.todayTxt}>Today</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Ongoing + Tasks */}
      <View style={S.sectionBlock}>
        <View style={S.sectionRow}>
          <Text style={S.sectionH}>Ongoing</Text>
          {showAll && (
            <TouchableOpacity
              onPress={() => setShowCompletedOnly((v) => !v)}
              style={[
                S.completedBtn,
                showCompletedOnly && S.completedBtnActive,
              ]}
              activeOpacity={0.9}
            >
              <Ionicons
                name={
                  showCompletedOnly
                    ? "checkmark-circle"
                    : "checkmark-circle-outline"
                }
                size={14}
                color={showCompletedOnly ? "#FFFFFF" : "#111827"}
              />
              <Text
                style={[
                  S.completedTxt,
                  showCompletedOnly && { color: "#FFFFFF" },
                ]}
              >
                Show Completed
              </Text>
              <View
                style={[
                  S.badge,
                  showCompletedOnly && {
                    backgroundColor: "rgba(255,255,255,0.2)",
                  },
                ]}
              >
                <Text
                  style={[
                    S.badgeTxt,
                    showCompletedOnly && { color: "#FFFFFF" },
                  ]}
                >
                  {(tasks || []).filter((t) => !!t?.done).length}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        </View>

        <ScrollView
          style={S.tasksScroll}
          contentContainerStyle={S.tasksContent}
          keyboardShouldPersistTaps="handled"
        >
          {visibleTasks.length === 0 ? (
            <View style={S.emptyCard}>
              <Text style={S.emptyTxt}>Nothing scheduled.</Text>
            </View>
          ) : (
            <View style={S.dayCard}>
              {visibleTasks.map((t) => (
                <TaskTile
                  key={String(t.id || t.title)}
                  t={t}
                  expanded={!!expanded[t.id]}
                  onToggleExpand={() =>
                    setExpanded((e) => ({ ...e, [t.id]: !e[t.id] }))
                  }
                />
              ))}
            </View>
          )}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}

function bannerDateLabel(key) {
  const d = parseYmd(key);
  return `${DOW[d.getDay()]}, ${String(d.getDate()).padStart(2, "0")} ${MONTHS[
    d.getMonth()
  ].slice(0, 3)}`;
}

function TaskTile({ t, expanded, onToggleExpand }) {
  const isDone = !!t?.done;
  const catKey = t?.cat || t?.category || "UNCATEGORIZED";
  const tag = TAGS_MAP[catKey] || TAGS_MAP["UNCATEGORIZED"];

  const BG = isDone ? "#6B7280" : tag?.color || "#2563EB";

  const timeSource = t?.dueTime || t?.time || t?.due_at || t?.createdAt;
  const timeLabel = formatTime(timeSource);
  const strikeStyle = isDone ? { textDecorationLine: "line-through" } : null;

  return (
    <View style={S.taskWrap}>
      <TouchableOpacity
        style={[
          S.taskInner,
          { backgroundColor: BG, opacity: isDone ? 0.92 : 1 },
        ]}
        onPress={onToggleExpand}
        activeOpacity={0.9}
      >
        <View style={{ flex: 1 }}>
          <View style={S.rowBetween}>
            <Text style={[S.taskTitle, strikeStyle]} numberOfLines={1}>
              {t?.title || "(untitled)"}
            </Text>
            <View style={S.timeChip}>
              <Ionicons name="time-outline" size={12} color="#FFFFFF" />
              <Text style={S.timeChipTxt}>{timeLabel}</Text>
            </View>
          </View>

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 6,
              marginTop: 2,
            }}
          >
            <Text style={[S.taskMeta, strikeStyle]}>
              {tag?.label || "Category"}
            </Text>
            {isDone && (
              <View style={S.doneBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
                <Text style={S.doneBadgeTxt}>Completed</Text>
              </View>
            )}
          </View>

          {expanded && !!t?.why && (
            <>
              <View style={S.inTileDivider} />
              <View style={S.inTileDesc}>
                <Text style={S.inTileDescTxt}>{t.why}</Text>
              </View>
            </>
          )}
        </View>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color="#FFFFFF"
        />
      </TouchableOpacity>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: "#F3F4F6" },
  wrapCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 12,
    paddingTop: 8,
    marginBottom: 2,
    marginTop: 15,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  monthPicker: { flexDirection: "row", alignItems: "center", gap: 10 },
  smallNav: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  monthText: { fontSize: 20, fontWeight: "800", color: "#1F2937" },
  calendarBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },

  stripContainer: { height: 96, justifyContent: "center" },
  stripWrap: {
    paddingHorizontal: 12,
    gap: 8,
    alignItems: "center",
    marginTop: 6.5,
  },
  pill: {
    width: 64,
    height: 88,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  pillDay: { fontSize: 20, fontWeight: "800" },
  pillMon: { fontSize: 12, fontWeight: "700", marginTop: 2 },
  todayTag: {
    position: "absolute",
    top: 6,
    right: 13.5,
    backgroundColor: "#111827",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
  },
  todayTxt: { color: "#FFFFFF", fontSize: 9, fontWeight: "900" },
  allPill: {
    width: 76,
    backgroundColor: "#FFFFFF",
    flexDirection: "column",
    gap: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  allTxt: { fontSize: 14, fontWeight: "800", color: "#111827" },

  sectionBlock: { marginTop: 20, flex: 1 },
  sectionRow: {
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionH: {
    fontSize: 18,
    fontWeight: "900",
    color: "#111827",
    marginTop: 15,
    marginBottom: 10,
  },

  completedBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    marginBottom: 5,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  completedBtnActive: {
    backgroundColor: "#2563EB",
    borderColor: "#000000ff",
    borderWidth: 1.5,
  },
  completedTxt: { fontSize: 11, fontWeight: "900", color: "#111827" },
  badge: {
    marginLeft: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#F3F4F6",
  },
  badgeTxt: { fontSize: 10, fontWeight: "900", color: "#111827" },

  tasksScroll: { flex: 1 },
  tasksContent: { paddingHorizontal: 12, paddingBottom: 28 },

  emptyCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
  },
  emptyTxt: { color: "#6B7280", fontWeight: "700" },

  dayCard: { backgroundColor: "#FFFFFF", padding: 10, borderRadius: 14 },

  taskWrap: { marginBottom: 10 },
  taskInner: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 25,
    borderRadius: 15,
    gap: 13,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  taskTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "900",
    flexShrink: 1,
    paddingRight: 10,
  },
  taskMeta: { color: "#FFFFFF", opacity: 0.9, marginTop: 2, fontWeight: "700" },

  timeChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  timeChipTxt: { color: "#FFFFFF", fontWeight: "800", fontSize: 11 },

  inTileDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.35)",
    marginTop: 10,
    marginBottom: 8,
  },
  inTileDesc: {
    backgroundColor: "rgba(255,255,255,0.14)",
    padding: 8,
    borderRadius: 10,
  },
  inTileDescTxt: { color: "#FFFFFF", fontWeight: "700", lineHeight: 20 },

  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  doneBadgeTxt: { color: "#FFFFFF", fontSize: 10, fontWeight: "900" },
});
