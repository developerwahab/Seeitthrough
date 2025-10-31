// src/ads/DebugAdsPanel.js
import React, { useEffect, useState } from "react";
import { View, Text, Pressable } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';
import {
  onAppOpenForInterstitial,
  resetInterstitialCounter,
  OPEN_COUNT_KEY,        // ✅ import the same key from interstitial
} from "./interstitial";
import { isPreviewBuild } from "../dev/ProTestKit"; // ✅ preview aware

export default function DebugAdsPanel() {
  // ✅ show in preview builds (EAS preview) and in dev; prod me hide
  if (!isPreviewBuild()) return null;

  const [count, setCount] = useState(0);

  async function refresh() {
    const n = parseInt((await AsyncStorage.getItem(OPEN_COUNT_KEY)) || "0", 10);
    setCount(n);
  }

  useEffect(() => { refresh(); }, []);

  return (
    <View style={{
      position: "absolute", right: 5, bottom: 120,
      padding: 10, backgroundColor: "#0008", borderRadius: 8
    }}>
      <Text style={{ color: "#fff", marginBottom: 8 }}>
        Open count: {count}
      </Text>

      <Pressable
        onPress={async () => { await resetInterstitialCounter(); await refresh(); }}
        style={{ backgroundColor: "#444", padding: 8, borderRadius: 6, marginBottom: 6 }}>
        <Text style={{ color: "#fff" }}>Reset counter</Text>
      </Pressable>

      <Pressable
        onPress={async () => { await onAppOpenForInterstitial(); await refresh(); }}
        style={{ backgroundColor: "#1e88e5", padding: 8, borderRadius: 6 }}>
        <Text style={{ color: "#fff" }}>Simulate OPEN (+1)</Text>
      </Pressable>
    </View>
  );
}
