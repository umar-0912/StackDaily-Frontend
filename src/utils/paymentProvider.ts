import { getLocales } from 'expo-localization';

export type PaymentProviderType = 'razorpay' | 'stripe';

/**
 * Detect payment provider based on device locale region.
 * India (region = IN) -> Razorpay, everywhere else -> Stripe.
 * Uses expo-localization for reliable cross-platform locale detection.
 */
export function getPaymentProvider(): PaymentProviderType {
  try {
    const locales = getLocales();
    const region = locales[0]?.regionCode?.toUpperCase() ?? '';

    if (region === 'IN') {
      return 'razorpay';
    }
  } catch {
    // Fallback: if locale detection fails, default to stripe (international)
  }

  return 'stripe';
}

export function getCurrencySymbol(provider: PaymentProviderType): string {
  return provider === 'razorpay' ? '\u20B9' : '$';
}
