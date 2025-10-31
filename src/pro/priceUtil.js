// src/pro/priceUtil.js
const SYMBOLS = {
  USD:"$", EUR:"€", GBP:"£", PKR:"₨", INR:"₹", AED:"د.إ", SAR:"﷼", QAR:"ر.ق", KWD:"د.ك",
  AUD:"$", CAD:"$", NZD:"$", SGD:"$", HKD:"$", JPY:"¥", CNY:"¥", KRW:"₩", TRY:"₺",
  MYR:"RM", IDR:"Rp", THB:"฿", VND:"₫", NGN:"₦", BDT:"৳", LKR:"Rs", NPR:"Rs", ZAR:"R",
  RUB:"₽", BRL:"R$", MXN:"$"
};

function formatWithIntl(amount, code, locale) {
  try {
    if (!isFinite(amount)) return null;
    if (code) return new Intl.NumberFormat(locale || undefined, { style: "currency", currency: code }).format(amount);
    return new Intl.NumberFormat(locale || undefined).format(amount);
  } catch { return null; }
}

export function computeDisplayPrice(p, locale) {
  if (p?.localizedPrice && /\S/.test(p.localizedPrice)) return String(p.localizedPrice);

  const currency =
    p?.currency || p?.currencyCode || p?.isoCurrencyCode || p?.priceCurrencyCode || null;

  if (p?.priceAmountMicros && currency) {
    const val = Number(p.priceAmountMicros) / 1_000_000;
    const intl = formatWithIntl(val, currency, locale);
    if (intl) return intl;
    const sym = SYMBOLS[(currency || "").toUpperCase()] || currency;
    return `${sym} ${val.toFixed(2)}`;
  }

  if (p?.price && /[^\d.,\s-]/.test(String(p.price))) return String(p.price);

  if (p?.price && currency) {
    const num = Number(String(p.price).replace(/[^\d.,-]/g, "").replace(/,/g, ""));
    const intl = formatWithIntl(num, currency, locale);
    if (intl) return intl;
    const sym = SYMBOLS[(currency || "").toUpperCase()] || currency;
    if (isFinite(num)) return `${sym} ${num.toFixed(2)}`;
  }

  return p?.price ? String(p.price) : "";
}

export function normalizeProducts(products, locale) {
  const out = (products || []).map((p) => ({
    ...p,
    displayPrice: computeDisplayPrice(p, locale),
  }));
  try {
    console.table(
      out.map((p) => ({
        id: p?.productId || p?.sku || p?.productIdentifier,
        price: p?.price,
        localizedPrice: p?.localizedPrice,
        micros: p?.priceAmountMicros,
        currency: p?.currency || p?.currencyCode || p?.isoCurrencyCode || p?.priceCurrencyCode,
        displayPrice: p?.displayPrice,
      }))
    );
  } catch (e) {
    console.log("IAP PRODUCTS:", out);
  }
  return out;
}
f