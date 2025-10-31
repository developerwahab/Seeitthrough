export const AdEventType = { LOADED: 'loaded', CLOSED: 'closed', ERROR: 'error' };
export const TestIds = { INTERSTITIAL: 'TEST' };

export const MobileAds = {
  initialize: async () => ({ isInitializationComplete: true }),
};
export default MobileAds;

export class InterstitialAd {
  static createForAdRequest() { return new InterstitialAd(); }
  addAdEventListener() { return () => {}; }
  load() {}
  show() {}
}
 