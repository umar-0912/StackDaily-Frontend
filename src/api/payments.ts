import { apiClient } from './client';
import type {
  SubscribeRequest,
  SubscribeResponse,
  CancelSubscriptionResponse,
} from '../types';

export const paymentsApi = {
  subscribe: (data: SubscribeRequest) =>
    apiClient.post<SubscribeResponse>('/payments/subscribe', data),

  cancelSubscription: () =>
    apiClient.post<CancelSubscriptionResponse>('/payments/cancel'),
};
