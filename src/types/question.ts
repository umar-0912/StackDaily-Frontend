export enum QuestionDifficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export interface TopicSummary {
  _id: string;
  name: string;
  slug: string;
}

export interface Question {
  _id: string;
  topicId: TopicSummary;
  text: string;
  difficulty: QuestionDifficulty;
  tags: string[];
  isActive: boolean;
  lastUsedDate?: string | null;
  usageCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedQuestionsResponse {
  data: Question[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
