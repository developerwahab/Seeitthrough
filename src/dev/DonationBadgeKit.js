// src/dev/DonationBadgeKit.js
import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
import { recordDonation, clearDonationBadge, hasDonationBadge } from "../pro/donationBadge";

let Updates; try { Updates = require("expo-updates"); } catch {}

function isPreviewBuild() {
  try {
    if (typeof __DEV__ !== "undefined" && __DEV__) return true;
    const ch = (Updates?.channel || Updates?.releaseChannel || "").toLowerCase();
    return ch && ch !== "production" && ch !== "prod";
  } catch { return false; }
}
 
export function DonationBadgeTestButton() {
  const [on, setOn] = useState(false);
  const [visible, setVisible] = useState(isPreviewBuild());

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const h = await hasDonationBadge();
        if (alive) setOn(!!h);
      } catch {}
    })();
    return () => { alive = false; };
  }, []);

  if (!visible) return null;

  async function toggle() {
    try {
      if (on) {
        await clearDonationBadge();
        setOn(false);
      } else {
        await recordDonation();
        setOn(true);
      }
    } catch {}
  }

  return (
    <TouchableOpacity
      onPress={toggle}
      activeOpacity={0.8}
      style={[S.fab, on ? S.fabOn : S.fabOff]}
    >
      <Text style={[S.fabText, on ? S.fabTextOn : S.fabTextOff]}>
        {on ? "Don-badge" : "Don-badge"}
      </Text>
    </TouchableOpacity>
  );
}

const S = StyleSheet.create({
  fab: {
    fontSize: 6,
    position: "absolute",
    bottom: 165,
    right: 162,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 2,
    ...Platform.select({
      android: { elevation: 6 },
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.15,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
    }),
  },
  fabOn:  { backgroundColor: "#111827", borderColor: "#111827" },
  fabOff: { backgroundColor: "#FFFFFF", borderColor: "#111827" },
  fabText:   { fontWeight: "800", fontSize: 12 },
  fabTextOn: { color: "#FFFFFF" },
  fabTextOff:{ color: "#111827" },
});
