import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import RazorpayCheckout from 'react-native-razorpay';
import { paymentsApi } from '../api/payments';
import { QUERY_KEYS } from '../utils/constants';

/**
 * Hook to create a Razorpay subscription.
 * On success, opens the Razorpay native checkout sheet in-app.
 */
export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await paymentsApi.subscribe();
      return data;
    },
    onSuccess: async (data) => {
      try {
        await RazorpayCheckout.open({
          key: data.razorpayKeyId,
          subscription_id: data.subscriptionId,
          name: 'StackDaily',
          description: 'Pro Subscription - Unlimited Topics',
          theme: { color: '#6200EE' },
        });

        // Payment succeeded — webhook will handle PRO upgrade, refresh local state
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.subscription] });
        queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
      } catch (error: any) {
        // User dismissed checkout or payment failed
        // error.code === 2 means user cancelled — don't show alert
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
 * Hook to cancel the user's active Razorpay subscription.
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
