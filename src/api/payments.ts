import { apiClient } from './client';
import type {
  SubscribeResponse,
  CancelSubscriptionResponse,
} from '../types';

export const paymentsApi = {
  subscribe: () =>
    apiClient.post<SubscribeResponse>('/payments/subscribe'),

  cancelSubscription: () =>
    apiClient.post<CancelSubscriptionResponse>('/payments/cancel'),
};
