export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export interface Streak {
  count: number;
  lastActiveDate: string | null;
}

export interface PopulatedTopic {
  _id: string;
  name: string;
  slug: string;
  icon?: string;
}

export interface User {
  _id: string;
  email: string;
  username: string;
  role: UserRole;
  isActive: boolean;
  subscribedTopics: PopulatedTopic[];
  streak: Streak;
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
  username: string;
  password: string;
  subscribedTopics?: string[];
}

export interface UpdateProfileRequest {
  email?: string;
  username?: string;
}

export interface UpdateSubscriptionsRequest {
  topicIds: string[];
}

export interface UpdateFcmTokenRequest {
  fcmToken: string;
}
