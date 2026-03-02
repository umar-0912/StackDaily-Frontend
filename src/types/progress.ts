export interface TopicProgressSummary {
  _id: string;
  name: string;
  slug: string;
  icon?: string | null;
}

export interface TopicProgress {
  _id: string;
  topic: TopicProgressSummary;
  status: 'not_started' | 'in_progress' | 'completed';
  currentQuestionIndex: number;
  questionsAnswered: number;
  totalQuestions: number;
  currentDifficulty: 'beginner' | 'intermediate' | 'advanced';
  percentComplete: number;
  startedAt: string | null;
  completedAt: string | null;
}
