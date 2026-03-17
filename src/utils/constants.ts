import { Platform } from 'react-native';

// Google OAuth Web Client ID — used by @react-native-google-signin
// Set this to your GCP Web OAuth Client ID
export const GOOGLE_WEB_CLIENT_ID = '409646617319-pqldv1erphdeje7kr6bi9komt2mna11h.apps.googleusercontent.com';

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

export const SUBSCRIPTION_TIERS = {
  yearly: {
    key: 'yearly' as const,
    name: 'Yearly',
    pricePerMonth: 15,
    totalMonths: 12,
    totalPrice: 180,
    billingLabel: '₹15/month × 12 months',
    savingsLabel: 'Save 50%',
    badge: 'Best Value',
    badgeColor: '#4CAF50',
  },
  half_yearly: {
    key: 'half_yearly' as const,
    name: 'Half-Yearly',
    pricePerMonth: 20,
    totalMonths: 6,
    totalPrice: 120,
    billingLabel: '₹20/month × 6 months',
    savingsLabel: 'Save 33%',
    badge: 'Popular',
    badgeColor: '#FF9800',
  },
  monthly: {
    key: 'monthly' as const,
    name: 'Monthly',
    pricePerMonth: 30,
    totalMonths: 1,
    totalPrice: 30,
    billingLabel: '₹30 for 1 month',
    savingsLabel: null,
    badge: null,
    badgeColor: null,
  },
} as const;

/** Stripe (USD) tier configs for international users */
export const STRIPE_SUBSCRIPTION_TIERS = {
  yearly: {
    key: 'yearly' as const,
    name: 'Yearly',
    pricePerMonth: 0.50,
    totalMonths: 12,
    totalPrice: 6.00,
    billingLabel: '$0.50/month \u00D7 12 months',
    savingsLabel: 'Save 50%',
    badge: 'Best Value',
    badgeColor: '#4CAF50',
  },
  half_yearly: {
    key: 'half_yearly' as const,
    name: 'Half-Yearly',
    pricePerMonth: 0.75,
    totalMonths: 6,
    totalPrice: 4.50,
    billingLabel: '$0.75/month \u00D7 6 months',
    savingsLabel: 'Save 25%',
    badge: 'Popular',
    badgeColor: '#FF9800',
  },
  monthly: {
    key: 'monthly' as const,
    name: 'Monthly',
    pricePerMonth: 1.00,
    totalMonths: 1,
    totalPrice: 1.00,
    billingLabel: '$1.00 for 1 month',
    savingsLabel: null,
    badge: null,
    badgeColor: null,
  },
} as const;

export const STRIPE_PUBLISHABLE_KEY = 'pk_test_51L8dRMSCdcr3BzakZFiumzvhsg6pwgpZHgc58uTixlkxEslOtBJ2xh6jp87WEczI39tm4r6wD7Qg89Xy18U8BP1U00w9AhFCPy';

/** Ordered list for display (best value first) */
export const SUBSCRIPTION_TIER_ORDER = ['yearly', 'half_yearly', 'monthly'] as const;

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
