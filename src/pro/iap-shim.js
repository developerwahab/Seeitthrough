// no-op shim for react-native-iap
const noop = async () => null;
export const initConnection = noop;
export const endConnection = noop;
export const getProducts = async () => [];
export const getSubscriptions = async () => [];
export const getAvailablePurchases = async () => [];
export const requestPurchase = noop;
export const requestSubscription = noop;
export const flushFailedPurchasesCachedAsPendingAndroid = noop;
export const purchaseUpdatedListener = () => ({ remove: () => {} });
export const purchaseErrorListener = () => ({ remove: () => {} });
export default {
  initConnection, endConnection, getProducts, getSubscriptions,
  getAvailablePurchases, requestPurchase, requestSubscription,
  flushFailedPurchasesCachedAsPendingAndroid,
  purchaseUpdatedListener, purchaseErrorListener,
};
