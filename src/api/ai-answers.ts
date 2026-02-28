import { apiClient } from './client';

export interface AiAnswer {
  _id: string;
  questionId: string;
  answer: string;
  generatedAt: string;
  model: string;
  tokenCount?: number;
}

export const aiAnswersApi = {
  getAnswer: (questionId: string) =>
    apiClient.get<AiAnswer>(`/ai-answers/question/${questionId}`),
};
