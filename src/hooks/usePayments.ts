import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { useStripe } from '@stripe/stripe-react-native';
import { paymentsApi } from '../api/payments';
import { QUERY_KEYS, SUBSCRIPTION_TIERS } from '../utils/constants';
import { getPaymentProvider } from '../utils/paymentProvider';
import type {
  SubscriptionTier,
  RazorpaySubscribeResponse,
  StripeSubscribeResponse,
} from '../types';

/**
 * Hook to create a subscription via Razorpay (India) or Stripe (international).
 * Detects provider from device locale and branches checkout accordingly.
 */
export function useSubscribe() {
  const queryClient = useQueryClient();
  const { initPaymentSheet, presentPaymentSheet } = useStripe();

  return useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const provider = getPaymentProvider();
      const { data } = await paymentsApi.subscribe({ tier, provider });
      return { ...data, tier, provider };
    },
    onSuccess: async (data) => {
      if (data.provider === 'razorpay') {
        const razorpayData = data as RazorpaySubscribeResponse & {
          tier: SubscriptionTier;
          provider: 'razorpay';
        };
        const tierConfig = SUBSCRIPTION_TIERS[razorpayData.tier];
        try {
          await RazorpayCheckout.open({
            key: razorpayData.razorpayKeyId,
            subscription_id: razorpayData.subscriptionId,
            name: 'StackDaily',
            description: `Pro \u00B7 ${tierConfig.name} Plan`,
            theme: { color: '#6200EE' },
          });

          // Payment succeeded -- webhook will handle PRO upgrade, refresh local state
          queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.subscription] });
          queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
        } catch (error: any) {
          // User dismissed checkout or payment failed
          // error.code === 2 means user cancelled -- don't show alert
          if (error?.code !== 2) {
            const message =
              error?.description || error?.message || 'Payment was not completed';
            Alert.alert('Payment Failed', message);
          }
        }
      } else {
        // Stripe flow
        const stripeData = data as StripeSubscribeResponse & {
          tier: SubscriptionTier;
          provider: 'stripe';
        };
        const { error: initError } = await initPaymentSheet({
          paymentIntentClientSecret: stripeData.clientSecret,
          customerEphemeralKeySecret: stripeData.ephemeralKey,
          customerId: stripeData.stripeCustomerId,
          merchantDisplayName: 'StackDaily',
        });

        if (initError) {
          Alert.alert('Payment Error', initError.message);
          return;
        }

        const { error: presentError } = await presentPaymentSheet();

        if (presentError) {
          // User cancelled -- don't show alert
          if (presentError.code !== 'Canceled') {
            Alert.alert('Payment Failed', presentError.message);
          }
          return;
        }

        // Payment succeeded -- webhook will handle PRO upgrade, refresh local state
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.subscription] });
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
      }
    },
    onError: (error: any) => {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        'Something went wrong. Please try again.';
      Alert.alert('Subscription Failed', message);
    },
  });
}

/**
 * Hook to cancel the user's active subscription.
 * Backend handles provider routing (Razorpay or Stripe) automatically.
 */
export function useCancelSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await paymentsApi.cancelSubscription();
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.subscription] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
    },
  });
}
