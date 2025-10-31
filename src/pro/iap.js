// // // src/pro/iap.js
// // import { Platform } from "react-native";
// // import { setPro, isPro  } from "./store";

// // /* --------------------------
// //    Product IDs (Play Console)
// // --------------------------- */
// // export const UNLOCK_SKUS = Platform.select({
// //   android: ["pro_unlock"],
// //   ios: ["pro_unlock"],
// // });

// // export const DONATION_SKUS = Platform.select({
// //   android: [
// //     "donation_tier_1",
// //     "donation_tier_2",
// //     "donation_tier_3",
// //     "donation_tier_4",
// //     "donation_tier_5",
// //     "donation_tier_6",
// //     "donation_tier_7",
// //   ],
// //   ios: [
// //     "donation_tier_1",
// //     "donation_tier_2",
// //     "donation_tier_3",
// //     "donation_tier_4",
// //     "donation_tier_5",
// //     "donation_tier_6",
// //     "donation_tier_7",
// //   ],
// // });

// // /* --------------------------
// //    Lazy require (CRASH-SAFE)
// // --------------------------- */
// // let RNIap = null;
// // function getIAP() {
// //   if (RNIap) return RNIap;
// //   try {
// //     // eslint-disable-next-line global-require
// //     RNIap = require("react-native-iap");
// //   } catch (e) {
// //     RNIap = null;
// //   }
// //   return RNIap;
// // }

// // /* --------------------------
// //    Connection lifecycle
// // --------------------------- */
// // let _connected = false;

// // async function ensureConnected() {
// //   if (_connected) return true;
// //   const IAP = getIAP();
// //   if (!IAP) return false;
// //   try {
// //     _connected = await IAP.initConnection();
// //   } catch {
// //     _connected = false;
// //   }
// //   return _connected;
// // }

// // export async function initIAP() {
// //   return ensureConnected();
// // }

// // export function cleanupIAP() {
// //   try {
// //     const IAP = getIAP();
// //     if (IAP) IAP.endConnection();
// //   } catch {}
// // }

// // /* --------------------------
// //    Catalog helpers
// // --------------------------- */
// // async function getProductsCompat(skus) {
// //   const IAP = getIAP();
// //   if (!IAP || !(await ensureConnected())) return [];
// //   // RN IAP v13 usually: getProducts({ skus })
// //   try {
// //     return await IAP.getProducts({ skus });
// //   } catch {
// //     // Older signatures fallback: getProducts(skus)
// //     try {
// //       return await IAP.getProducts(skus);
// //     } catch {
// //       return [];
// //     }
// //   }
// // }

// // export async function listUnlockProducts() {
// //   try { return await getProductsCompat(UNLOCK_SKUS); } catch { return []; }
// // }
// // export async function listDonationProducts() {
// //   try { return await getProductsCompat(DONATION_SKUS); } catch { return []; }
// // }
// // export async function listAllProducts() {
// //   try { return await getProductsCompat([...UNLOCK_SKUS, ...DONATION_SKUS]); } catch { return []; }
// // }

// // /* --------------------------
// //    Purchase helpers
// // --------------------------- */
// // async function requestPurchaseSafe(productId) {
// //   if (!productId) throw new Error("Missing productId");
// //   const IAP = getIAP();
// //   if (!IAP || !(await ensureConnected())) throw new Error("IAP not available");
// //   // RN IAP v13: requestPurchase({ sku, andDangerouslyFinishTransactionAutomatically })
// //   return IAP.requestPurchase({
// //     sku: productId,
// //     skus: [productId], // tolerated by most versions
// //     andDangerouslyFinishTransactionAutomatically: false,
// //   });
// // }

// // export async function buyUnlockSku(productId) {
// //   const IAP = getIAP();
// //   if (!IAP || !(await ensureConnected())) return false;
// //   const purchase = await requestPurchaseSafe(productId);
// //   try { await IAP.finishTransaction({ purchase, isConsumable: false }); } catch {}
// //   await setPro(true);
// //   return true;
// // }

// // export async function buyDonationSku(productId) {
// //   const IAP = getIAP();
// //   if (!IAP || !(await ensureConnected())) return false;
// //   const purchase = await requestPurchaseSafe(productId);
// //   // Android donations are consumable
// //   try {
// //     if (Platform.OS === "android" && purchase?.purchaseToken) {
// //       await IAP.consumePurchaseAndroid(purchase.purchaseToken);
// //     }
// //   } catch {}
// //   try { await IAP.finishTransaction({ purchase, isConsumable: true }); } catch {}
// //   return true;
// // }

// // /* --------------------------
// //    Restore
// // --------------------------- */
// // export async function restorePremium() {
// //   try {
// //     const IAP = getIAP();
// //     if (!IAP || !(await ensureConnected())) return false;
// //     const list = await IAP.getAvailablePurchases();
// //     const hasUnlock = list?.some((p) => UNLOCK_SKUS.includes(p.productId));
// //     await setPro(!!hasUnlock);
// //     return !!hasUnlock;
// //   } catch {
// //     return false;
// //   }
// // }

// // /* --------------------------
// //    Convenience
// // --------------------------- */
// // export async function buyPro() {
// //   return buyUnlockSku(UNLOCK_SKUS[0]);
// // }













// // src/pro/iap.js — IAP OFF (pure JS, no native imports)
// import { setPro } from "./store";

// export const UNLOCK_SKUS = ["pro_unlock"];
// export const DONATION_SKUS = [
//   "donation_tier_1","donation_tier_2","donation_tier_3",
//   "donation_tier_4","donation_tier_5","donation_tier_6","donation_tier_7",
// ];

// /** connection lifecycle (no-op) */
// export async function initIAP() { return false; }
// export async function initIapConnection() { return false; }
// export function  cleanupIAP() {}

// /** catalog (empty) */
// export async function listUnlockProducts() { return []; }
// export async function listDonationProducts() { return []; }
// export async function listAllProducts() { return []; }

// /** purchase helpers (no-op) */
// export async function buyUnlockSku() { return false; }
// export async function buyDonationSku() { return false; }
// export async function buyDonationTier() { return false; }
// export async function buyPro() { return false; }

// /** restore (forces non-pro) */
// export async function restorePremium() { await setPro(false); return false; }
// export async function restoreProFromPurchases() { await setPro(false); return false; }









 

import { Platform, Alert } from "react-native";
import { setPro } from "./store";
import {
  initConnection,
  endConnection,
  fetchProducts,
  requestPurchase,
  finishTransaction,
  getAvailablePurchases,
  purchaseUpdatedListener,
  purchaseErrorListener,
} from "expo-iap";
 
export const UNLOCK_SKUS = ["pro_unlock"];
export const DONATION_SKUS = 
[
  "donation_tier_1",
  "donation_tier_2",
  "donation_tier_3",
  "donation_tier_4",
  "donation_tier_5",
  "donation_tier_6",
  "donation_tier_7",
];
 
let _inited = false;
let _subUpdate = null;
let _subError = null;

export async function initIAP() {
  if (_inited) return true;
  try {
    const ok = await initConnection(); 
    _attachListeners();
    _inited = !!ok;
    return _inited;
  } catch (e) {
    _inited = false;
    return false;
  }
}

export function cleanupIAP() {
  try {
    _detachListeners();
    endConnection();
  } catch {}
}
 
function _attachListeners() {
  if (_subUpdate || _subError) return;

  _subUpdate = purchaseUpdatedListener(async (purchase) => {
    try {
      const pid = purchase?.productId || purchase?.productIdentifier;
      if (!pid) return;

      const isUnlock = UNLOCK_SKUS.includes(pid);
      const isDonation = DONATION_SKUS.includes(pid); 
      if (isUnlock) {
        await setPro(true); 
      }
 
      await finishTransaction({
        purchase, 
        isConsumable: Platform.OS === "android" && isDonation ? true : false,
      });

      if (isDonation) { 
        try {
          const { recordDonation } = require("./donationBadge");
          await recordDonation();
        } catch {}
      }
    } catch (e) { 
    }
  });

  _subError = purchaseErrorListener((error) => { 
    if (String(error?.code || "").includes("CANCEL")) return; 
    console.log("IAP error:", error?.code, error?.message);
  });
}

function _detachListeners() {
  try { _subUpdate?.remove?.(); } catch {}
  try { _subError?.remove?.(); } catch {}
  _subUpdate = null;
  _subError = null;
}
 
export async function listUnlockProducts() {
  try {
    await initIAP();
    return await fetchProducts({ skus: UNLOCK_SKUS, type: "in-app" });
  } catch {
    return [];
  }
}

export async function listDonationProducts() {
  try {
    await initIAP();
    return await fetchProducts({ skus: DONATION_SKUS, type: "in-app" });
  } catch {
    return [];
  }
}

export async function listAllProducts() {
  try {
    await initIAP();
    const [a, b] = await Promise.all([
      fetchProducts({ skus: UNLOCK_SKUS, type: "in-app" }),
      fetchProducts({ skus: DONATION_SKUS, type: "in-app" }),
    ]);
    return [...(a || []), ...(b || [])];
  } catch {
    return [];
  }
}

function normalizeProductId(p) {
  if (!p) return "";
  if (typeof p === "string") return p.trim();
  return (
    p.productId ||
    p.productIdentifier || 
    p.sku ||              
    p.id ||                
    ""
  );
}

// ---- Purchase helpers ----
async function _requestPurchase(productId) {
  if (!productId) throw new Error("Missing productId");
  await initIAP(); 
  return requestPurchase({
    request: {
      ios: { sku: productId, quantity: 1 },
      android: { skus: [productId] },
    },
    type: "in-app",
  });
}

export async function buyUnlockSku(productOrId) {
  const id = normalizeProductId(productOrId) || UNLOCK_SKUS[0];
  await _requestPurchase(id);
  return true;
}

export async function buyDonationSku(productOrId) {
  const id = normalizeProductId(productOrId);
  if (!id) throw new Error("Missing productId");
  await _requestPurchase(id);
  return true;
}
 
export async function buyPro() {
  return buyUnlockSku(UNLOCK_SKUS[0]);
}
 
export async function restorePremium() {
  try {
    await initIAP();
    const purchases = await getAvailablePurchases();
    const hasUnlock = Array.isArray(purchases)
      ? purchases.some((p) => UNLOCK_SKUS.includes(p.productId || p.productIdentifier))
      : false;
    await setPro(!!hasUnlock);
    return !!hasUnlock;
  } catch {
    return false;
  }
}
 
export const initIapConnection = initIAP;
export async function restoreProFromPurchases() {
  return restorePremium();
}
