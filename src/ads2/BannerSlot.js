import React from "react";
import { Platform, View } from "react-native";
import mobileAds, { BannerAd, BannerAdSize } from "react-native-google-mobile-ads";
import { ANDROID_BANNER_IDS, IOS_BANNER_IDS } from "./config";
import { onProChange } from "../pro/store";
 
const SIZES = [
  BannerAdSize.BANNER,                   
  BannerAdSize.LARGE_BANNER,            
  BannerAdSize.ANCHORED_ADAPTIVE_BANNER,  
];

function isValidUnit(id) {
  return /^ca-app-pub-\d{16}\/\d+$/.test((id || "").trim());
}

export default function BannerSlot({ style }) {
  const ALL_IDS = Platform.OS === "ios" ? IOS_BANNER_IDS : ANDROID_BANNER_IDS;

  const [pro, setPro] = React.useState(false);
  const [idIdx, setIdIdx] = React.useState(0);
  const [sizeIdx, setSizeIdx] = React.useState(0);
  const [key, setKey] = React.useState(0);
  const [visible, setVisible] = React.useState(true);
  const fails = React.useRef(0);
  const timer = React.useRef(null);

  React.useEffect(() => onProChange(setPro), []);
  if (pro) return null;

  React.useEffect(() => {
    mobileAds().initialize().catch(() => {});
    return () => timer.current && clearTimeout(timer.current);
  }, []);

  if (!ALL_IDS?.length) return null;

  const unitId = (ALL_IDS[idIdx % ALL_IDS.length] || "").trim();
  const size = SIZES[sizeIdx % SIZES.length];
 
  console.log("[Ads] Requesting banner", { unitId, size });

  if (!isValidUnit(unitId)) {
    console.warn("[Ads] Invalid banner unit:", unitId);
    return null;
  }

  const onLoaded = () => {
    fails.current = 0;
    setVisible(true);
    console.log("[Ads] Banner loaded", { unitId, size });
  };

  const scheduleRetry = (ms) => {
    setVisible(false);
    timer.current = setTimeout(() => {
      fails.current = 0;
      setSizeIdx(0);
      setKey((k) => k + 1);
      setVisible(true);
    }, ms);
  };

  const onFail = (e) => {
    console.log("[Ads] Banner error:", JSON.stringify(e));
    fails.current += 1;
 
    if (fails.current <= 2) {
      setSizeIdx((i) => (i + 1) % SIZES.length);
      setKey((k) => k + 1);
      return;
    } 
    if (ALL_IDS.length > 1) {
      setIdIdx((i) => (i + 1) % ALL_IDS.length);
      setSizeIdx(0);
      setKey((k) => k + 1);
      return;
    } 
    const backoff = Math.min(10000 * 2 ** Math.max(0, fails.current - 3), 60000);
    scheduleRetry(backoff);
  };

  if (!visible) return null;

  return (
    <View style={[{ alignItems: "center", width: "100%", minHeight: 60 }, style]}>
      <BannerAd
        key={`${key}-${unitId}-${size}`}
        unitId={unitId}
        size={size} 
        requestOptions={{ requestNonPersonalizedAdsOnly: false }}
        onAdLoaded={onLoaded}
        onAdFailedToLoad={onFail}
      />
    </View>
  );
}
