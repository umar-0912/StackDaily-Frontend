import { apiClient } from './client';
import type { Question } from '../types';

export const questionsApi = {
  getQuestion: (id: string) => apiClient.get<Question>(`/questions/${id}`),
};
