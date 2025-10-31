// src/dev/ProTestKit.js
import React, { useEffect, useState } from "react";
import { TouchableOpacity, Text, StyleSheet, Platform } from "react-native";
// import AsyncStorage from "@react-native-async-storage/async-storage";
import AsyncStorage from '../utils/safeAsyncStorage';

let Updates;
try { Updates = require("expo-updates"); } catch {}

const OVERRIDE_KEY = "sit/dev/pro_override/v2";
let __forcePro = false;

export function isPreviewBuild() { 
  if (__DEV__) return true;
 
  const flag = (process.env.EXPO_PUBLIC_SHOW_DEBUG_PANELS || "").toLowerCase();
  if (flag === "1" || flag === "true" || flag === "yes") return true;
 
  try {
    if (Updates?.channel && /preview|dev/i.test(Updates.channel)) return true;
  } catch {}

  return false;
}
 
function hardWrapProFns(mod) {
  if (!mod || typeof mod !== "object") return;
  const names = ["isPaid", "isPro", "isPremium", "hasPremium"];
  for (const k of names) {
    if (typeof mod[k] === "function") {
      const original = mod[k].bind(mod);
      mod[k] = function wrapped() {
        return __forcePro ? true : original();
      };
    }
  } 
  for (const flag of ["PAID", "IS_PAID", "premium", "is_premium", "paid"]) {
    if (flag in mod) {
      try { Object.defineProperty(mod, flag, { get: () => (__forcePro ? true : mod["__" + flag] ?? false), configurable: true }); } catch {}
    }
  }
}
 
export async function installProOverride() {
  try {
    const raw = await AsyncStorage.getItem(OVERRIDE_KEY);
    __forcePro = raw === "1";
  } catch {}
 
  try {
    const pay = require("../payments/store");
    hardWrapProFns(pay);
  } catch {}
 
  try {
    const pro = require("../pro/store");
    hardWrapProFns(pro); 
    if ("setDevOverride" in pro && typeof pro.setDevOverride === "function") {
      try { pro.setDevOverride(__forcePro); } catch {}
    }
  } catch {}
}
 
async function getOverride() { return __forcePro; }
async function setOverride(on) {
  __forcePro = !!on;
  try { await AsyncStorage.setItem(OVERRIDE_KEY, __forcePro ? "1" : "0"); } catch {}
  return __forcePro;
}
 
export function ProTestButton() {
  const [isPreview, setIsPreview] = useState(false);
  const [on, setOn] = useState(false);

  useEffect(() => {
    let m = true;
    (async () => {
      setIsPreview(isPreviewBuild());
      const cur = await getOverride();
      if (m) setOn(cur);
    })();
    return () => { m = false; };
  }, []);
  
  return (
    <TouchableOpacity
      onPress={async () => {
        const next = !(await getOverride());
        await setOverride(next);
        setOn(next);
      }}
      style={[styles.fab, on ? styles.fabOn : styles.fabOff]}
      activeOpacity={0.9}
    >
      <Text style={[styles.fabText, on ? styles.fabTextOn : styles.fabTextOff]}>
        {on ? "PRO: ON" : "PRO: OFF"}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    marginBlock: 100,
    marginRight: 150,
    position: "absolute",
    right: 16,
    bottom: 24,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    zIndex: 9999,
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
