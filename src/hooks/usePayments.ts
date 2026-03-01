import { useMutation, useQueryClient } from '@tanstack/react-query';
import * as Linking from 'expo-linking';
import { paymentsApi } from '../api/payments';
import { QUERY_KEYS } from '../utils/constants';

/**
 * Hook to create a Razorpay subscription.
 * On success, opens the Razorpay checkout URL in the system browser.
 */
export function useSubscribe() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data } = await paymentsApi.subscribe();
      return data;
    },
    onSuccess: async (data) => {
      // Open Razorpay checkout in the default browser
      await Linking.openURL(data.shortUrl);
      // Invalidate subscription info so it refreshes when the user returns
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.subscription] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
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
