export enum NotificationStatus {
  PENDING = 'pending',
  SENT = 'sent',
  FAILED = 'failed',
  DELIVERED = 'delivered',
}

export interface NotificationHistoryItem {
  _id: string;
  userId: string;
  dailySelectionId: string;
  status: NotificationStatus;
  error?: string;
  sentAt?: string;
  createdAt: string;
}

export interface PaginatedNotificationHistory {
  data: NotificationHistoryItem[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
