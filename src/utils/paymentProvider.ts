export type PaymentProviderType = 'razorpay' | 'stripe';

/**
 * Returns Razorpay as the sole payment provider.
 * India-only launch — Stripe support removed for now.
 */
export function getPaymentProvider(): PaymentProviderType {
  return 'razorpay';
}

export function getCurrencySymbol(_provider?: PaymentProviderType): string {
  return '\u20B9';
}
