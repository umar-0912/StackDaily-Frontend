import { apiClient } from './client';
import type {
  DailyFeedItem,
  MarkReadRequest,
  MarkReadResponse,
  NextQuestionRequest,
  NextQuestionResponse,
} from '../types';

export const dailyApi = {
  getFeed: () => apiClient.get<DailyFeedItem[]>('/daily/feed'),

  markRead: (data: MarkReadRequest) =>
    apiClient.post<MarkReadResponse>('/daily/mark-read', data),

  getNextQuestion: (data: NextQuestionRequest) =>
    apiClient.post<NextQuestionResponse>('/daily/next-question', data),
};
