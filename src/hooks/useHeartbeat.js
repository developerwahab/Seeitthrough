// src/hooks/useHeartbeat.js
import { useEffect, useRef, useState } from "react";
import { AppState } from "react-native";
import { useFocusEffect } from "@react-navigation/native";

export default function useHeartbeat(ms = 500) {
  const [tick, setTick] = useState(0);
  const appState = useRef(AppState.currentState);
  const timerRef = useRef(null);
  const focusedRef = useRef(false);
 
  const start = () => {
    if (timerRef.current) return;
    timerRef.current = setInterval(() => { 
      setTick((t) => t + 1);
    }, ms);
  };
  const stop = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
  };
 
  useFocusEffect(() => {
    focusedRef.current = true;
    if (appState.current === "active") start();
    return () => {
      focusedRef.current = false;
      stop();
    };
  });
 
  useEffect(() => {
    const sub = AppState.addEventListener("change", (next) => {
      appState.current = next;
      if (next === "active" && focusedRef.current) start();
      else stop();
    });
    return () => sub.remove();
  }, []);
 
  useEffect(() => () => stop(), []);

  return tick; 
}
