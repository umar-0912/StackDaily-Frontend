export interface FeedTopic {
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

export interface DailyFeedItem {
  dailySelectionId: string;
  topic: FeedTopic;
  question: FeedQuestion;
  answer: FeedAnswer;
}

export interface MarkReadRequest {
  dailySelectionId: string;
}

export interface MarkReadResponse {
  message: string;
}
