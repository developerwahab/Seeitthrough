// screens/ReloadingScreen.js
import React, { useEffect } from "react";
import { View, ActivityIndicator, StatusBar, Text } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { on, emit } from "../src/events/bus";
import { hardReloadApp } from "../src/utils/hardReload"; 

export default function ReloadingScreen() {
  const navigation = useNavigation();

  useEffect(() => { 
   if (global.__BOOT_READY__) {
     navigation.reset({ index: 0, routes: [{ name: "Main" }] });
     return;
   }
 
    const off = on("app/boot-ready", () => {
      navigation.reset({ index: 0, routes: [{ name: "Main" }] });
    });
 
   const watchdog = setTimeout(() => {
     navigation.reset({ index: 0, routes: [{ name: "Main" }] });
   }, 8000);

    return () => { clearTimeout(t); off?.(); };
  }, [navigation]);

  return (
    <View style={{
      flex: 1, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", padding: 24
    }}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <ActivityIndicator size="large" />
      <View style={{ height: 16 }} />
      <Text style={{ color: "#9CA3AF", fontSize: 13 }}>preparing things…</Text>
      <Text style={{ color: "#9CA3AF", fontSize: 13 }}>optimizing reminders…</Text>
      <Text style={{ color: "#9CA3AF", fontSize: 13 }}>warming up widgets…</Text>
    </View>
  );
}
