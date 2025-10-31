// screens/AboutScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Linking,
  Share,
  Platform,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";

const PRIVACY_URL = "https://sites.google.com/view/sit-privacy/home";
const TERMS_URL = "https://sites.google.com/view/sit-privacy/home";
const SUPPORT_EMAIL = "varsitymessaging@gmail.com";

const expo = Constants?.expoConfig ?? {};
const APP_NAME = expo.name ?? "See-It-Through";
const VERSION = expo.version ?? "1.0.0";
const PKG = expo.android?.package ?? "com.varsitymessaging.seeitthrough";
const VERSIONCODE = expo.android?.versionCode ?? null;

const handlePrivacy = () => {
  navigation.navigate("PrivacyPolicy");
};

export default function AboutScreen() {
  const navigation = useNavigation();

  const openLink = async (url) => {
    try {
      await Linking.openURL(url);
    } catch {}
  };

  const rateUs = async () => {
    const playUrl = `market://details?id=${PKG}`;
    const webUrl = `https://play.google.com/store/apps/details?id=${PKG}`;
    try {
      const can = await Linking.canOpenURL(playUrl);
      await Linking.openURL(can ? playUrl : webUrl);
    } catch {
      await Linking.openURL(webUrl);
    }
  };

  const contact = async () => {
    const mail = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(
      APP_NAME + " Support"
    )}`;
    try {
      await Linking.openURL(mail);
    } catch {}
  };

  const shareApp = async () => {
    const url = `https://play.google.com/store/apps/details?id=${PKG}`;
    try {
      await Share.share({ message: `Try ${APP_NAME}: ${url}` });
    } catch {}
  };

  return (
    <View style={S.screen}>
      {/* Top bar */}
      <View style={S.topbar}>
        <TouchableOpacity
          style={S.topBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Ionicons name="chevron-back" size={18} color="#111827" />
        </TouchableOpacity>
        <Text style={S.topTitle}>About</Text>
        <TouchableOpacity
          style={S.topBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.9}
        >
          <Ionicons
            name="information-circle-outline"
            size={18}
            color="#111827"
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={S.container}
        showsVerticalScrollIndicator={false}
      >
        {/* App Card */}
        <View style={S.card}>
          <View style={S.cardHeader}>
            <View style={S.cardHeaderL}>
              <View style={S.cardIcon}>
                <Ionicons
                  name="checkmark-done-outline"
                  size={18}
                  color="#111827"
                />
              </View>
              <Text style={S.cardTitle}>{APP_NAME}</Text>
            </View>
          </View>

          <View style={S.metaRow}>
            <Text style={S.metaKey}>Version</Text>
            <Text style={S.metaVal}>
              {VERSION}
              {VERSIONCODE ? ` (${VERSIONCODE})` : ""}
            </Text>
          </View>
          <View style={S.metaRow}>
            <Text style={S.metaKey}>Package</Text>
            <Text style={S.metaVal}>See-It-Through</Text>
          </View>
          <View style={[S.metaRow, { marginBottom: 0 }]}>
            <Text style={S.metaKey}>Platform</Text>
            <Text style={S.metaVal}>{Platform.OS.toUpperCase()}</Text>
          </View>
        </View>

        {/* Actions */}
        <View style={S.card}>
          <Text style={S.sectionLabel}>Quick actions</Text>
          <TouchableOpacity style={S.row} onPress={rateUs} activeOpacity={0.9}>
            <View style={S.rowL}>
              <View style={S.rowIcon}>
                <Ionicons name="star-outline" size={16} color="#111827" />
              </View>
              <Text style={S.rowText}>Rate on Play Store</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={S.row}
            onPress={shareApp}
            activeOpacity={0.9}
          >
            <View style={S.rowL}>
              <View style={S.rowIcon}>
                <Ionicons name="share-outline" size={16} color="#111827" />
              </View>
              <Text style={S.rowText}>Share the app</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={S.row}
            onPress={() => navigation.navigate("UnlockPro")}
            activeOpacity={0.9}
          >
            <View style={S.rowL}>
              <View style={S.rowIcon}>
                <Ionicons name="sparkles-outline" size={16} color="#111827" />
              </View>
              <Text style={S.rowText}>Say Thanks / Unlock Pro</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>
        </View>

        {/* Legal / Support */}
        <View style={S.card}>
          <Text style={S.sectionLabel}>Support & legal</Text>

          <TouchableOpacity style={S.row} onPress={contact} activeOpacity={0.9}>
            <View style={S.rowL}>
              <View style={S.rowIcon}>
                <Ionicons name="mail-outline" size={16} color="#111827" />
              </View>
              <Text style={S.rowText}>Contact support</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          <TouchableOpacity
            style={S.row}
            onPress={() => openLink(PRIVACY_URL)}
            activeOpacity={0.9}
          >
            <View style={S.rowL}>
              <View style={S.rowIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={16}
                  color="#111827"
                />
              </View>
              <Text style={S.rowText}>Privacy policy</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity>

          {/* <TouchableOpacity
            style={S.row}
            onPress={() => openLink(TERMS_URL)}
            activeOpacity={0.9}
          >
            <View style={S.rowL}>
              <View style={S.rowIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={16}
                  color="#111827"
                />
              </View>
              <Text style={S.rowText}>Terms & conditions</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color="#9CA3AF" />
          </TouchableOpacity> */}
        </View>

        <Text style={S.footer}>
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </Text>
        <View style={{ height: 20 }} />
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#F5F6F8" },

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

  sectionLabel: {
    color: "#6B7280",
    fontSize: 12,
    fontWeight: "800",
    textTransform: "uppercase",
    marginBottom: 6,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  metaKey: { color: "#6B7280", fontSize: 12 },
  metaVal: { color: "#111827", fontSize: 14, fontWeight: "700" },

  row: {
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
  },
  rowL: { flexDirection: "row", alignItems: "center", gap: 10 },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: "#F3F4F6",
    alignItems: "center",
    justifyContent: "center",
  },
  rowText: { color: "#111827", fontSize: 14, fontWeight: "700" },

  footer: { textAlign: "center", color: "#6B7280", fontSize: 12, marginTop: 6 },
});
