import { apiClient } from './client';
import type { PaginatedNotificationHistory } from '../types';

export const notificationsApi = {
  getHistory: (params?: { page?: number; limit?: number }) =>
    apiClient.get<PaginatedNotificationHistory>('/notifications/history', {
      params,
    }),

  sendTest: () => apiClient.post<{ message: string }>('/notifications/test'),
};
