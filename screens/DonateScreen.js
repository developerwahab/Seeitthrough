// screens/DonateScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Alert,
  Platform,
  NativeModules,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { listDonationProducts, buyDonationSku } from "../src/pro/iap";
 
const iapAvailable = Platform.OS !== "web";

export default function DonateScreen() {
  const navigation = useNavigation();
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        if (!iapAvailable) return;  
        const prods = await listDonationProducts();
        const sorted = [...prods].sort(
          (a, b) => (a?.priceAmountMicros ?? 0) - (b?.priceAmountMicros ?? 0)
        );
        if (alive) setItems(sorted);
      } catch (e) {
        Alert.alert("Store error", e?.message || "Unable to load donations.");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function onDonate(product) {
    try {
      setBusy(true);
      await buyDonationSku(product);  
      Alert.alert("Love from Our Team! ❤️", "Thanks for supporting the app.");
    } catch (e) {
      Alert.alert("Purchase failed", e?.message || "Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View
      style={{ flex: 1, backgroundColor: "#F4F5F7", paddingHorizontal: 18 }}
    >
      <View
        style={{
          paddingTop: 48,
          paddingBottom: 10,
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            backgroundColor: "#fff",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Ionicons name="chevron-back" size={18} color="#111827" />
        </TouchableOpacity>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>
          Say Thanks
        </Text>
        <View style={{ width: 38 }} />
      </View>

      {!iapAvailable ? (
        <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 12 }}>
          In-app billing isn’t available in Expo Go. Use a Dev Client or Play
          Internal Test build.
        </Text>
      ) : items.length === 0 ? (
        <Text style={{ textAlign: "center", color: "#6B7280", marginTop: 12 }}>
          No donation items found. Make sure donation_tier_* SKUs are Active.
        </Text>
      ) : (
        <FlatList
          style={{ marginTop: 12 }}
          data={items}
          keyExtractor={(it) => it.productId || it.productIdentifier || it.sku || String(it.id || Math.random())}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              disabled={busy}
              onPress={() => onDonate(item)}
              style={{
                padding: 14,
                borderRadius: 14,
                backgroundColor: "#111827",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
              activeOpacity={0.9}
            >
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {item.title?.replace(/\(.*\)$/, "").trim() || "Support"}
              </Text>
              <Text style={{ color: "#fff", fontWeight: "800" }}>
                {item.localizedPrice || item.price || ""}
              </Text>
            </TouchableOpacity>
          )}
        />
      )}

      <Text
        style={{
          textAlign: "center",
          color: "#6B7280",
          marginTop: 12,
          marginBottom: 16,
        }}
      >
        Note: Donations don’t unlock features. Pro unlock is a separate one-time
        item.
      </Text>
    </View>
  );
}
