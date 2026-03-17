import { useEffect, useRef, useCallback, useState } from 'react';
import {
  InterstitialAd,
  AdEventType,
} from 'react-native-google-mobile-ads';
import { useIsProUser } from './useIsProUser';
import { AD_UNIT_IDS, INTERSTITIAL_TIMEOUT_MS } from '../utils/adConfig';

interface UseInterstitialAdReturn {
  /**
   * Show the interstitial ad. If the ad is loaded, it opens immediately and
   * invokes `onClosed` when the user dismisses it. If the ad isn't loaded
   * (or the user is Pro), `onClosed` fires synchronously so the caller's
   * flow is never blocked.
   */
  showAd: (onClosed?: () => void) => void;
  /** Whether the ad has finished loading and is ready to display. */
  isAdReady: boolean;
}

/**
 * Hook that manages the full lifecycle of an interstitial ad:
 * preload on mount → show on demand → execute callback on close →
 * 10 s safety timeout → auto-reload.
 */
export function useInterstitialAd(): UseInterstitialAdReturn {
  const isProUser = useIsProUser();
  const [isAdReady, setIsAdReady] = useState(false);
  const adRef = useRef<InterstitialAd | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const unsubscribersRef = useRef<Array<() => void>>([]);
  /** Pending callback to invoke when the ad closes. */
  const onClosedRef = useRef<(() => void) | null>(null);

  const clearAdTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  /** Flush the pending onClosed callback (if any) exactly once. */
  const flushOnClosed = useCallback(() => {
    const cb = onClosedRef.current;
    onClosedRef.current = null;
    cb?.();
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
        flushOnClosed();
        loadAd(); // Preload the next ad
      },
    );

    const unsubError = interstitial.addAdEventListener(
      AdEventType.ERROR,
      () => setIsAdReady(false),
    );

    unsubscribersRef.current = [unsubLoaded, unsubClosed, unsubError];
    interstitial.load();
  }, [isProUser, clearAdTimeout, flushOnClosed]);

  // Preload on mount
  useEffect(() => {
    loadAd();
    return () => {
      clearAdTimeout();
      unsubscribersRef.current.forEach((unsub) => unsub());
      unsubscribersRef.current = [];
      onClosedRef.current = null;
    };
  }, [loadAd, clearAdTimeout]);

  /**
   * Show the ad. `onClosed` fires after the user dismisses the ad.
   * If the ad isn't ready (Pro user, load failure, etc.), `onClosed`
   * fires immediately so the caller's flow proceeds without blocking.
   */
  const showAd = useCallback(
    (onClosed?: () => void) => {
      if (isProUser || !adRef.current || !isAdReady) {
        // No ad to show — invoke callback immediately
        onClosed?.();
        return;
      }

      // Store callback for the CLOSED event
      onClosedRef.current = onClosed ?? null;
      adRef.current.show();

      // Safety net: reset state after 10 s so the hook is ready for next use.
      // The actual ad remains on screen until the user taps ✕ (Google policy).
      timeoutRef.current = setTimeout(() => {
        clearAdTimeout();
        setIsAdReady(false);
        flushOnClosed();
        loadAd();
      }, INTERSTITIAL_TIMEOUT_MS);
    },
    [isProUser, isAdReady, clearAdTimeout, flushOnClosed, loadAd],
  );

  return { showAd, isAdReady };
}
