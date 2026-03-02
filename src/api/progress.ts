import { apiClient } from './client';
import type { TopicProgress } from '../types';

export const progressApi = {
  getAll: () => apiClient.get<TopicProgress[]>('/progress'),

  getByTopic: (topicId: string) =>
    apiClient.get<TopicProgress>(`/progress/${topicId}`),
};
