export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum SubscriptionPlan {
  FREE = 'free',
  PRO = 'pro',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELLED = 'cancelled',
  EXPIRED = 'expired',
}

export interface Subscription {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  startDate: string | null;
  endDate: string | null;
  cancelledAt: string | null;
}

export interface SubscriptionInfo {
  plan: SubscriptionPlan;
  status: SubscriptionStatus;
  maxTopics: number | null;
  currentTopicCount: number;
  isOverLimit: boolean;
  startDate: string | null;
  endDate: string | null;
  daysRemaining: number | null;
}

export interface Streak {
  count: number;
  maxStreak: number;
  lastActiveDate: string | null;
}

export interface PopulatedTopic {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

export enum AuthProvider {
  LOCAL = 'local',
  GOOGLE = 'google',
}

export interface User {
  _id: string;
  email: string;
  name: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  isEmailVerified: boolean;
  authProvider?: AuthProvider;
  subscribedTopics: PopulatedTopic[];
  topicSubscriptionHistory: string[];
  streak: Streak;
  subscription: Subscription;
  fcmToken?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface TokenRefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  name: string;
  password: string;
  subscribedTopics?: string[];
}

export interface UpdateProfileRequest {
  email?: string;
  name?: string;
}

export interface UpdateSubscriptionsRequest {
  topicIds: string[];
}

export interface UpdateFcmTokenRequest {
  fcmToken: string;
}

export interface SubscribeResponse {
  shortUrl: string;
  subscriptionId: string;
  razorpayKeyId: string;
}

export interface CancelSubscriptionResponse {
  message: string;
}

export interface VerifyEmailRequest {
  email: string;
  otp: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  email: string;
  otp: string;
  newPassword: string;
}

export interface ResendOtpRequest {
  email: string;
  type: 'email_verification' | 'password_reset';
}

export interface GoogleSignInRequest {
  idToken: string;
}

export interface MessageResponse {
  message: string;
}
