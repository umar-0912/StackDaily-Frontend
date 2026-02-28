import { apiClient } from './client';
import type {
  User,
  UpdateProfileRequest,
  UpdateSubscriptionsRequest,
  UpdateFcmTokenRequest,
} from '../types';

export const usersApi = {
  getProfile: () => apiClient.get<User>('/users/profile'),

  updateProfile: (data: UpdateProfileRequest) =>
    apiClient.patch<User>('/users/profile', data),

  updateSubscriptions: (data: UpdateSubscriptionsRequest) =>
    apiClient.patch<User>('/users/subscriptions', data),

  updateFcmToken: (data: UpdateFcmTokenRequest) =>
    apiClient.patch<{ message: string }>('/users/fcm-token', data),
};
