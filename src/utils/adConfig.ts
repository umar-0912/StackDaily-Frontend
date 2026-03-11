import { TestIds } from 'react-native-google-mobile-ads';

/** Use real ad unit IDs in production builds, test IDs in dev */
const USE_PRODUCTION_ADS = !__DEV__;

/**
 * Centralised ad unit IDs.
 * Replace the production strings with real AdMob console IDs before release.
 */
export const AD_UNIT_IDS = {
  FEED_BANNER: USE_PRODUCTION_ADS
    ? 'ca-app-pub-6499914499135192/9214890163'
    : TestIds.ADAPTIVE_BANNER,
  QUESTION_BANNER: USE_PRODUCTION_ADS
    ? 'ca-app-pub-6499914499135192/6788541953'
    : TestIds.ADAPTIVE_BANNER,
  INTERSTITIAL: USE_PRODUCTION_ADS
    ? 'ca-app-pub-6499914499135192/6520444060'
    : TestIds.INTERSTITIAL,
} as const;

/** Maximum time (ms) the interstitial ad stays before state resets */
export const INTERSTITIAL_TIMEOUT_MS = 10_000;
