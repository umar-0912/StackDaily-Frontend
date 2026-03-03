import { Platform } from 'react-native';

const getDevApiUrl = (): string => {
  // Point to deployed backend for Expo Go testing
  // For local backend: use your Mac's IP (e.g. http://192.168.x.x:3000/api/v1)
  return 'https://stackdaily-backend-production.up.railway.app/api/v1';
};

export const API_BASE_URL = __DEV__
  ? getDevApiUrl()
  : 'https://stackdaily-backend-production.up.railway.app/api/v1';

export const QUERY_KEYS = {
  feed: ['daily', 'feed'] as const,
  topics: ['topics'] as const,
  topic: (id: string) => ['topics', id] as const,
  question: (id: string) => ['questions', id] as const,
  aiAnswer: (questionId: string) => ['ai-answers', questionId] as const,
  profile: ['users', 'profile'] as const,
  subscription: ['users', 'subscription'] as const,
  notificationHistory: ['notifications', 'history'] as const,
  progress: ['progress'] as const,
  topicProgress: (topicId: string) => ['progress', topicId] as const,
} as const;

export const SUBSCRIPTION_LIMITS = {
  FREE_MAX_TOPICS: 3,
} as const;

export const DIFFICULTY_COLORS = {
  beginner: '#4CAF50',
  intermediate: '#FF9800',
  advanced: '#F44336',
} as const;

export const DIFFICULTY_LABELS = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
} as const;
