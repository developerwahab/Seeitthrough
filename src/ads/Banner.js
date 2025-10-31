// src/ads/Banner.js
import React, { useEffect, useState } from "react";
import { BannerAd, BannerAdSize, TestIds } from "react-native-google-mobile-ads";
import { isPro, onProChange } from "../pro/store"; // <-- Pro gate

const BANNER_UNIT_ID = __DEV__
  ? TestIds.BANNER
  : "ca-app-pub-7665935090660965/2620192118"; // your real ID

export default function Banner({ style }) {
  const [pro, setPro] = useState(isPro());
  useEffect(() => onProChange(setPro), []);
  if (pro) return null;              // <-- Pro: NO ADS
  return (
    <BannerAd
      unitId={BANNER_UNIT_ID}
      size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
      requestOptions={{ requestNonPersonalizedAdsOnly: false }}
      style={style}
    />
  );
}



// ads temporarily off 
// export default function Banner() { return null; }
