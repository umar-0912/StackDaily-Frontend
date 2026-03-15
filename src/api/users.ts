import { apiClient } from './client';
import type {
  User,
  UpdateProfileRequest,
  UpdateSubscriptionsRequest,
  UpdateFcmTokenRequest,
  SubscriptionInfo,
  UnsubscribeTopicRequest,
  UnsubscribeTopicResponse,
} from '../types';

export const usersApi = {
  getProfile: () => apiClient.get<User>('/users/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<User>('/users/profile', data),

  updateSubscriptions: (data: UpdateSubscriptionsRequest) =>
    apiClient.patch<User>('/users/subscriptions', data),

  updateFcmToken: (data: UpdateFcmTokenRequest) =>
    apiClient.patch<{ message: string }>('/users/fcm-token', data),

  getSubscriptionInfo: () =>
    apiClient.get<SubscriptionInfo>('/users/subscription'),

  unsubscribeTopic: (data: UnsubscribeTopicRequest) =>
    apiClient.post<UnsubscribeTopicResponse>('/users/subscriptions/unsubscribe', data),
};
