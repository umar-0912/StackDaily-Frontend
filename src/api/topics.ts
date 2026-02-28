import { apiClient } from './client';
import type { Topic, PaginatedTopicsResponse, TopicQueryParams } from '../types';

export const topicsApi = {
  getTopics: (params?: TopicQueryParams) =>
    apiClient.get<PaginatedTopicsResponse>('/topics', { params }),

  getTopic: (id: string) => apiClient.get<Topic>(`/topics/${id}`),
};
