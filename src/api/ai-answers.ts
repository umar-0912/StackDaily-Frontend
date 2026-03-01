import { apiClient } from './client';

export interface AiAnswerMcq {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface AiAnswer {
  _id: string;
  questionId: string;
  answer: string;
  generatedAt: string;
  model: string;
  tokenCount?: number;
  mcqs?: AiAnswerMcq[];
}

export const aiAnswersApi = {
  getAnswer: (questionId: string) =>
    apiClient.get<AiAnswer>(`/ai-answers/question/${questionId}`),
};
