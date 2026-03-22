import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { paymentsApi } from '../api/payments';
import { QUERY_KEYS, SUBSCRIPTION_TIERS } from '../utils/constants';
import type {
  SubscriptionTier,
  RazorpaySubscribeResponse,
} from '../types';

/**
 * Hook to create a subscription via Razorpay.
 * India-only launch — Stripe flow removed for now.
 */
export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tier: SubscriptionTier) => {
      const { data } = await paymentsApi.subscribe({ tier, provider: 'razorpay' });
      return { ...data, tier } as RazorpaySubscribeResponse & { tier: SubscriptionTier };
    },
    onSuccess: async (data) => {
      const tierConfig = SUBSCRIPTION_TIERS[data.tier];
      try {
        await RazorpayCheckout.open({
          key: data.razorpayKeyId,
          subscription_id: data.subscriptionId,
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
 * Backend handles provider routing automatically.
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
