export interface FeedTopic {
  _id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface FeedQuestion {
  text: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

export interface FeedMcq {
  question: string;
  options: string[];
  correctIndex: number;
}

export interface FeedAnswer {
  content: string;
  generatedAt: string;
  mcqs?: FeedMcq[];
}

export interface FeedProgress {
  status: 'not_started' | 'in_progress' | 'completed';
  questionsAnswered: number;
  totalQuestions: number;
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced';
  isRead?: boolean;
  canAdvance?: boolean;
}

export interface DailyFeedItem {
  dailySelectionId: string;
  topic: FeedTopic;
  question: FeedQuestion;
  answer: FeedAnswer;
  progress: FeedProgress;
}

export interface MarkReadRequest {
  dailySelectionId: string;
  topicId: string;
}

export interface MarkReadResponse {
  message: string;
}

export interface NextQuestionRequest {
  topicId: string;
}

export type NextQuestionResponse = DailyFeedItem | { message: string };
