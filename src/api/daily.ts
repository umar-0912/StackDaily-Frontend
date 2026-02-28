import { apiClient } from './client';
import type { DailyFeedItem, MarkReadRequest, MarkReadResponse } from '../types';

export const dailyApi = {
  getFeed: () => apiClient.get<DailyFeedItem[]>('/daily/feed'),

  markRead: (data: MarkReadRequest) =>
    apiClient.post<MarkReadResponse>('/daily/mark-read', data),
};
