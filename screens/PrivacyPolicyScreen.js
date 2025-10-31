// screens/PrivacyPolicyScreen.js
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";

const APP_NAME = "See-It-Through";
const CONTACT_EMAIL = "varsitymessaging@gmail.com";
const PRIVACY_URL = "https://sites.google.com/view/sit-privacy/home";

export default function PrivacyPolicyScreen() {
  const openWeb = () => {
    if (PRIVACY_URL && !PRIVACY_URL.includes("your-site")) {
      Linking.openURL(PRIVACY_URL).catch(() => {});
    }
  };

  return (
    <View style={S.wrap}>
      <Text style={S.h1}>Privacy Policy</Text>
      <Text style={S.sub}>Last updated: 17 Aug 2025</Text>

      {PRIVACY_URL ? (
        <TouchableOpacity onPress={openWeb} style={S.webBtn}>
          <Text style={S.webBtnTxt}>Open on the web</Text>
        </TouchableOpacity>
      ) : null}

      <ScrollView contentContainerStyle={S.body}>
        <Text style={S.p}>
          This Privacy Policy explains how {APP_NAME} handles your information.
        </Text>

        <Text style={S.h2}>What we collect</Text>
        <Text style={S.p}>
          • <Text style={S.bold}>Local app data:</Text> Your tasks, settings,
          and preferences are stored locally on your device using secure device
          storage (AsyncStorage).{"\n"}• <Text style={S.bold}>Payments:</Text>{" "}
          Purchases are processed by Google Play Billing. We do not receive your
          full payment details. Google provides us purchase tokens to unlock
          premium features.{"\n"}•{" "}
          <Text style={S.bold}>Backups (optional):</Text> If you use the Drive
          backup feature, your data is saved to your own Google Drive{" "}
          <Text style={S.bold}>AppData</Text> folder via your consent/Google
          OAuth.
        </Text>

        <Text style={S.h2}>How we use data</Text>
        <Text style={S.p}>
          We use your local data to schedule reminders/notifications and
          personalize the app experience. If enabled, Drive backup lets you
          restore your own data on the same Google account.
        </Text>

        <Text style={S.h2}>Data sharing</Text>
        <Text style={S.p}>
          We do not sell or share your personal data with third parties. We rely
          on platform providers to operate features: Google Play Billing
          (purchases) and Google Drive (optional backups).
        </Text>

        <Text style={S.h2}>Permissions</Text>
        <Text style={S.p}>
          • Notifications — to remind you about tasks.{"\n"}• Calendar
          (optional) — for “calendar aware” scheduling to avoid busy times.
          {"\n"}• “Cookies” consent—app-level consent for using device storage
          to save preferences.
        </Text>

        <Text style={S.h2}>Your choices</Text>
        <Text style={S.p}>
          You can export/import data, opt-in/out of backups, and clear app data
          from device settings at any time. Uninstalling the app removes local
          data stored by {APP_NAME}.
        </Text>

        <Text style={S.h2}>Children’s privacy</Text>
        <Text style={S.p}>
          {APP_NAME} is not directed to children under 6. If you believe a child
          provided data, contact us to remove it.
        </Text>

        <Text style={S.h2}>Changes</Text>
        <Text style={S.p}>
          We may update this policy. We’ll update the “Last updated” date above
          and, if changes are significant, notify within the app.
        </Text>

        <Text style={S.h2}>Contact</Text>
        <Text style={S.p}>
          For any questions, email us at{" "}
          <Text
            style={S.link}
            onPress={() => Linking.openURL(`mailto:${CONTACT_EMAIL}`)}
          >
            {CONTACT_EMAIL}
          </Text>
          .
        </Text>
      </ScrollView>
    </View>
  );
}

const S = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: "#F5F6F8",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  h1: { fontSize: 22, fontWeight: "800", color: "#111827" },
  sub: { fontSize: 12, color: "#6B7280", marginTop: 4, marginBottom: 10 },
  webBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#111827",
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  webBtnTxt: { color: "#fff", fontWeight: "800" },
  body: { paddingBottom: 40 },
  h2: {
    fontSize: 16,
    fontWeight: "800",
    color: "#111827",
    marginTop: 14,
    marginBottom: 6,
  },
  p: { fontSize: 14, color: "#374151", lineHeight: 20 },
  bold: { fontWeight: "800" },
  link: { color: "#2563EB", textDecorationLine: "underline" },
});
