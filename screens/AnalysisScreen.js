// screens/AnalysisScreen.js
import React, { useMemo, useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  AppState,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { loadTasks, loadSettings } from "../src/storage/tasks";
import { on } from "../src/events/bus";
import Svg, { Circle } from "react-native-svg";

const C = {
  bg: "#F6F7FB",
  card: "#FFFFFF",
  text: "#0F172A",
  muted: "#94A3B8",
  ringBg: "#E8EDF5",
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
  // legacy:
  { label: "Priority", value: "PRIORITY", color: "#E02424" },
  { label: "Additional", value: "ADDITIONAL", color: "#2F66FF" },
  { label: "Uncategorized", value: "UNCATEGORIZED", color: "#9CA3AF" },
];
const TAGS_MAP = Object.fromEntries(TAGS.map((t) => [t.value, t]));

const ymdLocal = (d) => {
  const Y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, "0");
  const D = String(d.getDate()).padStart(2, "0");
  return `${Y}-${M}-${D}`;
};
const parseYmd = (s) => {
  const [y, m, d] = (s || "").split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  dt.setHours(0, 0, 0, 0);
  return dt;
};
const today0 = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

function Ring({ size, stroke, progress, color, bg, rotate = -90 }) {
  const r = (size - stroke) / 2;
  const CIRC = 2 * Math.PI * r;
  const p = Math.max(0, Math.min(1, progress ?? 0));
  return (
    <Svg
      width={size}
      height={size}
      style={{ transform: [{ rotate: `${rotate}deg` }] }}
    >
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={bg}
        strokeWidth={stroke}
        fill="none"
      />
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        stroke={color}
        strokeWidth={stroke}
        fill="none"
        strokeDasharray={`${CIRC} ${CIRC}`}
        strokeDashoffset={CIRC * (1 - p)}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function computeMetrics(tasks) {
  const byCat = {};
  for (const t of tasks || []) {
    const key = t.cat || t.category || "UNCATEGORIZED";
    byCat[key] ||= { total: 0, done: 0 };
    byCat[key].total += 1;
    if (t.done) byCat[key].done += 1;
  }

  const today = today0();
  const todayKey = ymdLocal(today);

  const streakToday = (tasks || []).filter(
    (t) =>
      t.done &&
      (t.completedAt || t.dueDate) &&
      ymdLocal(parseYmd(t.completedAt || t.dueDate)) === todayKey
  ).length;

  const targetsToday = (tasks || []).filter((t) => {
    const key = ymdLocal(parseYmd(t.dueDate || t.completedAt || ""));
    return key === todayKey;
  }).length;
  const targetToday = Math.max(1, targetsToday);

  const upcoming = (tasks || [])
    .filter((t) => t.dueDate && parseYmd(t.dueDate) >= today && !t.done)
    .sort((a, b) => parseYmd(a.dueDate) - parseYmd(b.dueDate));

  return { byCat, streakToday, targetToday, upcoming };
}

function Card({ title, children, style }) {
  return (
    <View style={[styles.card, style]}>
      {title ? <Text style={styles.cardTitle}>{title}</Text> : null}
      {children}
    </View>
  );
}

function CatCard({ label, color, pct = 0, total = 0, done = 0 }) {
  const progress = Math.max(0, Math.min(1, pct));

  return (
    <View style={[styles.catCard, { marginRight: 12 }]}>
      {/* stacked rings */}
      <View style={styles.ringWrap}>
        <View style={styles.ringAbsFill}>
          <Ring
            size={96}
            stroke={10}
            progress={1}
            color={"#E9EEF6"}
            bg={"#E9EEF6"}
          />
        </View>
        <View style={styles.ringAbsFill}>
          <Ring
            size={96}
            stroke={10}
            progress={progress}
            color={color}
            bg="transparent"
          />
        </View>

        {/* centered numbers */}
        <View style={styles.catCenter}>
          <Text style={styles.catPct}>{Math.round(progress * 100)}%</Text>
          <Text style={styles.catMini}>
            {String(done).padStart(2, "0")}/{String(total).padStart(2, "0")}
          </Text>
        </View>
      </View>

      {/* label */}
      <View style={styles.catLabelRow}>
        <View style={[styles.catDot, { backgroundColor: color }]} />
        <Text numberOfLines={1} style={styles.catLabel}>
          {label}
        </Text>
      </View>
    </View>
  );
}

/* --------- Screen --------- */
export default function AnalysisScreen() {
  const navigation = useNavigation();
  const [tasks, setTasks] = useState([]);
  const [settings, setSettings] = useState(null);

  // load on focus
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        const [t, s] = await Promise.all([loadTasks(), loadSettings()]);
        if (!alive) return;
        setTasks(Array.isArray(t) ? t : []);
        setSettings(s || {});
      })();
      return () => {
        alive = false;
      };
    }, [])
  );
  useEffect(() => {
    const off = on("TASKS_UPDATED", async () => {
      const t = await loadTasks();
      setTasks(Array.isArray(t) ? t : []);
    });
    const sub = AppState.addEventListener("change", async (s) => {
      if (s === "active") {
        const t = await loadTasks();
        setTasks(Array.isArray(t) ? t : []);
      }
    });
    return () => {
      off?.();
      sub?.remove?.();
    };
  }, []);

  const { byCat, streakToday, targetToday, upcoming } = useMemo(
    () => computeMetrics(tasks),
    [tasks]
  );

  const catStats = useMemo(() => {
    const present = Object.entries(byCat).map(([value, { total, done }]) => {
      const meta = TAGS_MAP[value] || {
        label: value
          .replace(/_/g, " ")
          .replace(/\b\w/g, (m) => m.toUpperCase()),
        color: "#9CA3AF",
      };
      return {
        value,
        label: meta.label,
        color: meta.color,
        total,
        done,
        pct: total ? done / total : 0,
      };
    });
    return present.sort(
      (a, b) => b.total - a.total || a.label.localeCompare(b.label)
    );
  }, [byCat]);

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.topRow}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.hBtn}
        >
          <Ionicons name="chevron-back" size={20} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Analysis</Text>
        <View style={styles.hBtn}>
          <Ionicons name="pulse" size={18} color={C.text} />
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: 28, gap: 14 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Work Streak */}
        <Card title="Work Streak">
          <View style={{ alignItems: "center", marginVertical: 8 }}>
            <View style={{ position: "absolute" }}>
              <Ring
                size={220}
                stroke={16}
                progress={1}
                color={C.ringBg}
                bg={C.ringBg}
              />
            </View>
            <View style={{ position: "absolute" }}>
              <Ring
                size={220}
                stroke={16}
                progress={Math.min(
                  1,
                  (streakToday || 0) / Math.max(1, targetToday)
                )}
                color={"#2F66FF"}
                bg="transparent"
              />
            </View>
            <View
              style={{
                width: 220,
                height: 220,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Text style={{ fontSize: 38, fontWeight: "900", color: C.text }}>
                {streakToday}
              </Text>
              <Text style={{ color: C.muted, marginTop: 2 }}>
                {streakToday}/{targetToday} today
              </Text>
            </View>
          </View>
        </Card>

        {/* Categories (NEW) */}
        <Card title="Categories">
          {catStats.length === 0 ? (
            <Text style={{ color: C.muted }}>No categories yet.</Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingVertical: 6,
                paddingHorizontal: 2,
                gap: 12,
              }}
            >
              {catStats.map((c) => (
                <CatCard
                  key={c.value}
                  label={c.label}
                  color={c.color}
                  pct={c.pct}
                  total={c.total}
                  done={c.done}
                />
              ))}
            </ScrollView>
          )}
        </Card>

        {/* Upcoming */}
        <Text style={styles.kicker}>Upcoming Tasks</Text>
        {upcoming.length === 0 ? (
          <View style={[styles.upCard, { backgroundColor: C.card }]}>
            <Text style={{ color: C.muted }}>Nothing coming up.</Text>
          </View>
        ) : (
          upcoming.map((t) => {
            const tag =
              TAGS_MAP[t.cat] ||
              TAGS_MAP[t.category] ||
              TAGS_MAP["UNCATEGORIZED"];
            const bg = tag?.color || "#2563EB";
            const d = parseYmd(t.dueDate);
            const dateLabel = `${String(d.getDate()).padStart(2, "0")}/${String(
              d.getMonth() + 1
            ).padStart(2, "0")}/${d.getFullYear()}`;
            return (
              <View key={t.id} style={[styles.upCard, { backgroundColor: bg }]}>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    marginBottom: 6,
                  }}
                >
                  <View
                    style={{
                      paddingHorizontal: 8,
                      paddingVertical: 4,
                      borderRadius: 8,
                      backgroundColor: "rgba(255,255,255,0.18)",
                    }}
                  >
                    <Text style={{ color: "#fff", fontSize: 11 }}>
                      {dateLabel}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }} />
                  <View
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 11,
                      backgroundColor: "#FFFFFF",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Ionicons name="checkmark" size={12} color={C.text} />
                  </View>
                </View>

                <Text
                  style={{ color: "#fff", fontWeight: "800", fontSize: 16 }}
                  numberOfLines={1}
                >
                  {t.title}
                </Text>
                <Text
                  style={{ color: "#fff", opacity: 0.9, marginTop: 4 }}
                  numberOfLines={1}
                >
                  {tag?.label || "Category"}
                </Text>
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

/* --------- styles --------- */
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg, padding: 14, marginTop: 0 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  hBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: C.card,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  title: { fontSize: 16, fontWeight: "800", color: C.text },

  card: {
    backgroundColor: C.card,
    borderRadius: 18,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  cardTitle: {
    color: C.text,
    fontWeight: "800",
    fontSize: 14,
    marginBottom: 6,
  },

  kicker: { marginTop: 4, marginBottom: 6, color: C.text, fontWeight: "800" },

  upCard: {
    padding: 14,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.12,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },

  /* Category card */
  catCard: {
    width: 118,
    height: 140,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 10,
    paddingBottom: 12,
    paddingHorizontal: 8,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  catCenter: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  catPct: { fontSize: 18, fontWeight: "900", color: C.text },
  catMini: { marginTop: 2, fontSize: 10, fontWeight: "800", color: C.muted },
  catLabel: { marginTop: 8, fontWeight: "900", fontSize: 12 },
  catCard: {
    width: 128,
    height: 166,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 12,
    paddingBottom: 14,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: "rgba(17,24,39,0.06)",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
 
  ringWrap: {
    width: 96,
    height: 96,
    position: "relative", 
    alignItems: "center",
    justifyContent: "center",
  },
 
  ringAbsFill: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },

  /* centered text */
  catCenter: {
    width: 96,
    height: 96,
    alignItems: "center",
    justifyContent: "center",
  },

  catPct: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.2,
  },
  catMini: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: "800",
    color: "#94A3B8",
  },

  /* label row */
  catLabelRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    maxWidth: 112,
  },
  catDot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  catLabel: {
    fontSize: 13,
    fontWeight: "900",
    color: "#111827",
    flexShrink: 1,
  },
});
