export interface Topic {
  _id: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  icon?: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginatedTopicsResponse {
  data: Topic[];
  meta: PaginationMeta;
}

export interface TopicQueryParams {
  category?: string;
  isActive?: string;
  page?: number;
  limit?: number;
}
