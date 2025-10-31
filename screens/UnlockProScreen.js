// screens/UnlockProScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
  Alert,
  ScrollView,
  RefreshControl,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  initIAP,
  listUnlockProducts,
  listDonationProducts,
  buyUnlockSku,
  buyDonationSku,
  restorePremium,
} from "../src/pro/iap";
import { isPro, onProChange } from "../src/pro/store";
import { useNavigation } from "@react-navigation/native";
 
const Price = ({ item }) => { 
  if (item?.localizedPrice) {
    return <Text style={S.price}>{item.localizedPrice}</Text>;
  }
 
  if (item?.price) {
    return <Text style={S.price}>{item.price}</Text>;
  }
 
  if (item?.priceAmountMicros && item?.currency) {
    const value = item.priceAmountMicros / 1_000_000;
    try { 
      const formatted = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency: item.currency,
      }).format(value);
      return <Text style={S.price}>{formatted}</Text>;
    } catch { 
      return <Text style={S.price}>{`${item.currency} ${value.toFixed(2)}`}</Text>;
    }
  } 
  return <Text style={S.price} />;
};

const Row = ({ left, right, onPress, dark }) => (
  <Pressable onPress={onPress} style={[S.row, dark && S.rowDark]}>
    <Text style={[S.rowTitle, dark && S.rowTitleDark]} numberOfLines={1}>
      {left}
    </Text>
    <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
      {right}
      <Ionicons
        name="chevron-forward"
        size={16}
        color={dark ? "#fff" : "#111827"}
      />
    </View>
  </Pressable>
);

export default function UnlockProScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unlockItems, setUnlockItems] = useState([]);
  const [donationItems, setDonationItems] = useState([]);
  const [paid, setPaid] = useState(isPro());
  const navigation = useNavigation();

  useEffect(() => onProChange(setPaid), []);

  const sortByMicros = (a, b) =>
    (a?.priceAmountMicros ?? a?.introductoryPriceAmountMicros ?? 0) -
    (b?.priceAmountMicros ?? b?.introductoryPriceAmountMicros ?? 0);

  const fetchStoreData = useCallback(async () => {
    try {
      const [u, d] = await Promise.all([
        listUnlockProducts(),
        listDonationProducts(),
      ]);
      setUnlockItems(Array.isArray(u) ? [...u].sort(sortByMicros) : []);
      setDonationItems(Array.isArray(d) ? [...d].sort(sortByMicros) : []);
    } catch (e) {
      Alert.alert("Store error", e?.message || "Unable to load products.");
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await initIAP();
        if (!alive) return;
        await fetchStoreData();
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [fetchStoreData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await fetchStoreData();
    } finally {
      setRefreshing(false);
    }
  }, [fetchStoreData]);

  const onBuyUnlock = async (pid) => {
    try {
      await buyUnlockSku(pid);
    } catch (e) {
      Alert.alert("Purchase failed", e?.message || "Try again.");
    }
  };
  const onDonate = async (pid) => {
    try {
      await buyDonationSku(pid);
    } catch (e) {
      Alert.alert("Purchase failed", e?.message || "Try again.");
    }
  };
  const onRestore = async () => {
    try {
      const ok = await restorePremium();
      Alert.alert(
        ok ? "Restored" : "Not found",
        ok ? "Premium restored." : "No purchase found for this Play account."
      );
    } catch (e) {
      Alert.alert("Restore failed", e?.message || "Try again later.");
    }
  };

  if (loading) {
    return (
      <View style={S.center}>
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 8, color: "#6B7280" }}>Loading…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={S.wrap}
      contentContainerStyle={{ paddingBottom: 32 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Pressable
        onPress={() => navigation.goBack()}
        style={{
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 10,
          paddingHorizontal: 4,
          marginBottom: 10,
        }}
      >
        <Ionicons name="arrow-back" size={20} color="#111827" />
        <Text
          style={{
            flex: 1,
            textAlign: "center",
            alignItems: "center",
            fontSize: 16.5,
            fontWeight: "700",
            color: "#111827",
            marginBottom: -25,
            marginTop: -25,
            
          }}
        >
          Support the See It Through Team
        </Text>
        {/* right side spacer to balance layout */}
        <Ionicons name="arrow-back" size={20} color="transparent" />
      </Pressable>

      <Text style={S.subb}>
        This page is a bit like the tip jar at your favorite coffee shop. If See
        It Through has helped you stay focused, feel free to treat us to a
        virtual cup of coffee or something off the snack shelf. Your support
        helps keep us caffeinated and coding.
      </Text>
      <Text style={S.subb}>
        Whether you chip in or not, we're glad you're here. Now go finish that
        task.
      </Text>

      {paid ? (
        <View style={S.badge}>
          <Ionicons name="shield-checkmark" size={16} color="#10B981" />
          <Text style={S.badgeTxt}>You’re Pro — all features unlocked 🎉</Text>
        </View>
      ) : null}

      {/* Unlock section */}
      <Text style={S.section}>Unlock Full App</Text>
      <View style={S.card}>
        {unlockItems.length === 0 ? (
          <Text style={S.note}>
            No unlock product found. Make sure the app is installed from Play
            Internal Testing and the product is Active.
          </Text>
        ) : (
          <FlatList
            data={unlockItems}
            keyExtractor={(p) => p.productId || p.productIdentifier || p.sku || String(p.id || Math.random())}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Row
                dark
                left={item.title?.replace(/\(.*\)$/, "").trim() || "Full Unlock"}
                right={<Price item={item} />}
                onPress={() => onBuyUnlock(item)}
              />
            )}
            scrollEnabled={false}  
          />
        )}
      </View>

      {/* Donation section */}
      <Text style={S.section}>Donations</Text>
      <View style={S.card}>
        {donationItems.length === 0 ? (
          <Text style={S.note}>
            No donation items visible. Activate your donation SKUs and install
            from the testing track.
          </Text>
        ) : (
          <FlatList
            data={donationItems}
            keyExtractor={(p) => p.productId || p.productIdentifier || p.sku || String(p.id || Math.random())}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => (
              <Row
                left={item.title?.replace(/\(.*\)$/, "").trim() || "Support"}
                right={<Price item={item} />}
                onPress={() => onDonate(item)}
              />
            )}
            scrollEnabled={false}
          />
        )}
      </View>

      <Text style={S.sub}>
        Any one-time unlock grants full access. Donations are optional and don’t
        change features.
      </Text>
      <Pressable style={[S.restore]} onPress={onRestore}>
        <Ionicons name="refresh" size={16} color="#111827" />
        <Text style={S.restoreTxt}>Restore Purchases</Text>
      </Pressable>
    </ScrollView>
  );
}

const S = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 20,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F5F6F8",
  },
  h1: {
    fontSize: 22,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 4,
    textAlign: "center",
  },
  sub: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 16,
  },

  subb: {
    fontSize: 12,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 3,
  },

  section: {
    marginTop: 12,
    marginBottom: 8,
    color: "#4B5563",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
  },

  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  note: { fontSize: 13, color: "#6B7280" },

  row: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  rowDark: {
    backgroundColor: "#111827",
    borderColor: "#111827",
  },
  rowTitle: {
    fontSize: 14,
    fontWeight: "800",
    color: "#111827",
    maxWidth: "70%",
  },
  rowTitleDark: { color: "#FFFFFF" },
  price: { fontSize: 14, fontWeight: "800", color: "#10B981" },

  restore: {
    marginTop: 8,
    alignSelf: "center",
    flexDirection: "row",
    gap: 8,
    backgroundColor: "#F3F4F6",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  restoreTxt: { color: "#111827", fontWeight: "700" },

  badge: {
    alignSelf: "center",
    marginTop: 6,
    marginBottom: 8,
    backgroundColor: "#ECFDF5",
    borderColor: "#A7F3D0",
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  badgeTxt: { color: "#065F46", fontWeight: "700" },
});
