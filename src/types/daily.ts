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

export interface FeedAnswer {
  content: string;
  generatedAt: string;
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
