import { useAuthStore } from '../stores/authStore';
import { SubscriptionPlan } from '../types';

/**
 * Returns `true` if the current user has an active Pro subscription.
 * Used by ad components to hide ads for paying users.
 */
export function useIsProUser(): boolean {
  const user = useAuthStore((state) => state.user);
  return user?.subscription?.plan === SubscriptionPlan.PRO;
}
