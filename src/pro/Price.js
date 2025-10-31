// src/pro/Price.js
import React from "react";
import { Text } from "react-native";

const SYMBOLS = {
  USD: "$", EUR: "€", GBP: "£", PKR: "₨", INR: "₹", AED: "د.إ",
  CAD: "$", AUD: "$", SAR: "﷼", TRY: "₺", MYR: "RM", IDR: "Rp",
  NGN: "₦", BDT: "৳", LKR: "Rs", NPR: "Rs", KWD: "د.ك", QAR: "ر.ق",
};

function formatIntl(amount, code, locale) {
  try {
    if (!isFinite(amount)) return null;
    if (code) {
      return new Intl.NumberFormat(locale || undefined, {
        style: "currency",
        currency: code,
      }).format(amount);
    }
    return new Intl.NumberFormat(locale || undefined).format(amount);
  } catch {
    return null;
  }
}

export default function Price({ item, style, locale }) { 
    if (item?.displayPrice) {
    return <Text style={style || { fontSize: 14, fontWeight: "800" }}>{item.displayPrice}</Text>;
  } 
  if (item?.localizedPrice) {
    return <Text style={style || { fontSize: 14, fontWeight: "800" }}>{item.localizedPrice}</Text>;
  }
 
  const micros = item?.priceAmountMicros;
  const currency =
    item?.currency || item?.currencyCode || item?.isoCurrencyCode || item?.priceCurrencyCode || null;
 
  if (micros && currency) {
    const value = Number(micros) / 1_000_000;
    const fmt = formatIntl(value, currency, locale);
    if (fmt) return <Text style={style || { fontSize: 14, fontWeight: "800" }}>{fmt}</Text>;
 
    const sym = SYMBOLS[currency?.toUpperCase?.()] || currency;
    return (
      <Text style={style || { fontSize: 14, fontWeight: "800" }}>
        {sym} {value.toFixed(2)}
      </Text>
    );
  }
 
  if (item?.price) {
    return <Text style={style || { fontSize: 14, fontWeight: "800" }}>{String(item.price)}</Text>;
  }
 
  return <Text style={style || { fontSize: 14, fontWeight: "800" }}>{""}</Text>;
}
