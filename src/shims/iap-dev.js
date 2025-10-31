// // src/shims/iap-dev.js
// import { Platform, Alert } from 'react-native';
// export const UNLOCK_SKUS = Platform.select({ android: ['pro_unlock'], ios: ['pro_unlock'] });
// export const DONATION_SKUS = Platform.select({
//   android: ['donation_tier_1','donation_tier_2','donation_tier_3','donation_tier_4','donation_tier_5','donation_tier_6','donation_tier_7'],
//   ios:     ['donation_tier_1','donation_tier_2','donation_tier_3','donation_tier_4','donation_tier_5','donation_tier_6','donation_tier_7'],
// });
// const nope = (msg='IAP disabled in dev build') => { Alert.alert('IAP (dev)', msg); return false; };
// export const initConnection = async () => true;
// export const endConnection = () => {};
// export const getProducts = async () => [];                
// export const requestPurchase = async () => nope();
// export const getAvailablePurchases = async () => [];    
// export const finishTransaction = async () => {};
// export const consumePurchaseAndroid = async () => {};
// export const flushFailedPurchasesCachedAsPendingAndroid = async () => {};
// export default module.exports;
