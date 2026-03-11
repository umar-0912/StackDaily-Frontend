import { useEffect, useRef, useCallback, useState } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { useIsProUser } from './useIsProUser';
import { AD_UNIT_IDS, INTERSTITIAL_TIMEOUT_MS } from '../utils/adConfig';

interface UseInterstitialAdReturn {
  /** Call to show the interstitial. No-op if ad isn't loaded or user is Pro. */
  showAd: () => void;
  /** Whether the ad has finished loading and is ready to display. */
  isAdReady: boolean;
}

/**
 * Hook that manages the full lifecycle of an interstitial ad:
 * preload on mount → show on demand → 10 s safety timeout → auto-reload.
 */
export function useInterstitialAd(): UseInterstitialAdReturn {
  const isProUser = useIsProUser();
  const [isAdReady, setIsAdReady] = useState(false);
  const adRef = useRef<InterstitialAd | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);

  const clearAdTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Create a fresh ad instance and start loading. */
  const loadAd = useCallback(() => {
    if (isProUser) return;

    // Tear down previous listeners
    unsubscribersRef.current.forEach((unsub) => unsub());
    unsubscribersRef.current = [];

    const interstitial = InterstitialAd.createForAdRequest(
      AD_UNIT_IDS.INTERSTITIAL,
    );
    adRef.current = interstitial;

    const unsubLoaded = interstitial.addAdEventListener(
      AdEventType.LOADED,
      () => setIsAdReady(true),
    );

    const unsubClosed = interstitial.addAdEventListener(
      AdEventType.CLOSED,
      () => {
        clearAdTimeout();
        setIsAdReady(false);
        loadAd(); // Preload the next ad
      },
    );

    const unsubError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => setIsAdReady(false),
    );

    unsubscribersRef.current = [unsubLoaded, unsubClosed, unsubError];
    interstitial.load();
  }, [isProUser, clearAdTimeout]);

  // Preload on mount
  useEffect(() => {
    loadAd();
    return () => {
      clearAdTimeout();
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
    };
  }, [loadAd, clearAdTimeout]);

  /** Show the ad with a 10 s safety timeout that resets hook state. */
  const showAd = useCallback(() => {
    if (isProUser || !adRef.current || !isAdReady) return;

    adRef.current.show();

    // Safety net: reset state after 10 s so the hook is ready for next use.
    // The actual ad remains on screen until the user taps ✕ (Google policy).
    timeoutRef.current = setTimeout(() => {
      clearAdTimeout();
      setIsAdReady(false);
      loadAd();
    }, INTERSTITIAL_TIMEOUT_MS);
  }, [isProUser, isAdReady, clearAdTimeout, loadAd]);

  return { showAd, isAdReady };
}
