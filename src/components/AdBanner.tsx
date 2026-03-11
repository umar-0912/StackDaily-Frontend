import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { BannerAd, BannerAdSize } from 'react-native-google-mobile-ads';
import { useIsProUser } from '../hooks/useIsProUser';

interface AdBannerProps {
  unitId: string;
  size?: BannerAdSize;
}

/**
 * Reusable banner ad component.
 * - Returns null for Pro users (no ads).
 * - Returns null if the ad fails to load (graceful degradation).
 */
export function AdBanner({
  unitId,
  size = BannerAdSize.ANCHORED_ADAPTIVE_BANNER,
}: AdBannerProps) {
  const isProUser = useIsProUser();
  const [adError, setAdError] = useState(false);

  const handleAdFailedToLoad = useCallback(() => {
    setAdError(true);
  }, []);

  if (isProUser || adError) {
    return null;
  }

  return (
    <View style={styles.container}>
      <BannerAd
        unitId={unitId}
        size={size}
        onAdFailedToLoad={handleAdFailedToLoad}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
});
