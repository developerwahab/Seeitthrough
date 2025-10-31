// // src/payments/iap.js
// // Uses react-native-iap (recommended). If you use expo-managed workflow and want expo-in-app-purchases, say so.

// import * as RNIap from 'react-native-iap';
// import AsyncStorage from '../utils/safeAsyncStorage'; // use your existing safeAsyncStorage
// import { EventEmitter } from 'events';

// const PRO_KEY = 'sit:pro';
// const PURCHASE_INIT_KEY = 'sit:purchaseInit';
// export const UNLOCK_SKUS = ['pro_unlock']; // <- make sure it matches Play Console managed product id

// const emitter = new EventEmitter();

// // Simple local state cache
// let _isInit = false;
// let _products = [];
// let _isPro = false;

// async function savePro(v){
//   _isPro = !!v;
//   try { await AsyncStorage.setItem(PRO_KEY, _isPro ? '1' : '0'); } catch {}
//   emitter.emit('change', _isPro);
// }

// export async function isPro() {
//   try {
//     if (_isPro !== undefined) return !!_isPro;
//     const v = await AsyncStorage.getItem(PRO_KEY);
//     _isPro = (v === '1');
//     return !!_isPro;
//   } catch {
//     return !!_isPro;
//   }
// }

// export function onProChange(cb){
//   emitter.on('change', cb);
//   return () => emitter.removeListener('change', cb);
// }

// /* ---------- Init ---------- */
// export async function initPurchases() {
//   if (_isInit) return;
//   try {
//     await RNIap.initConnection();
//     _isInit = true;

//     // get product details
//     try {
//       const prods = await RNIap.getProducts(UNLOCK_SKUS);
//       _products = prods || [];
//     } catch(e){
//       console.warn('IAP getProducts failed', e);
//       _products = [];
//     }

//     // set up purchase update listener
//     RNIap.purchaseUpdatedListener(async (purchase) => {
//       try {
//         const receipt = purchase.transactionReceipt || purchase.purchaseToken || purchase.originalJson;
//         if (!receipt) return;

//         // for managed product, acknowledge/finishTransaction
//         try {
//           if (purchase.purchaseToken && RNIap.finishTransaction) {
//             await RNIap.finishTransaction(purchase, false);
//           } else if (RNIap.finishTransaction) {
//             await RNIap.finishTransaction(purchase);
//           }
//         } catch (e) {
//           console.warn('finishTransaction error', e);
//         }

//         // Mark pro unlocked
//         await savePro(true);
//       } catch (err) {
//         console.warn('purchaseUpdatedListener error', err);
//       }
//     });

//     RNIap.purchaseErrorListener((err) => {
//       console.warn('purchaseErrorListener', err);
//     });

//     // restore cached state
//     const cached = await AsyncStorage.getItem(PRO_KEY);
//     _isPro = cached === '1';
//   } catch (e) {
//     console.warn('initPurchases failed', e);
//   }
// }

// /* ---------- Buy ---------- */
// export async function buyPro() {
//   if (!_isInit) await initPurchases();
//   try {
//     // request purchase
//     const sku = UNLOCK_SKUS[0];
//     await RNIap.requestPurchase(sku, false);
//     return true;
//   } catch (e) {
//     console.warn('buyPro error', e);
//     throw e;
//   }
// }

// /* ---------- Restore ---------- */
// export async function restorePurchases() {
//   if (!_isInit) await initPurchases();
//   try {
//     const purchases = await RNIap.getAvailablePurchases();
//     // find unlock sku in purchases
//     const found = (purchases || []).some(p => {
//       const id = p.productId || p.productIdentifier || p.packageName;
//       return UNLOCK_SKUS.includes(id);
//     });
//     await savePro(found);
//     return found;
//   } catch (e) {
//     console.warn('restorePurchases err', e);
//     return false;
//   }
// }

// /* ---------- Convenience ---------- */
// export async function ensurePro() {
//   await initPurchases();
//   const p = await isPro();
//   if (!p) {
//     // try restore automatically
//     await restorePurchases();
//   }
//   return await isPro();
// }

// export default {
//   initPurchases,
//   buyPro,
//   restorePurchases,
//   isPro,
//   ensurePro,
//   onProChange,
// };
