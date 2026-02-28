import { useQuery } from '@tanstack/react-query';
import { topicsApi } from '../api/topics';
import { QUERY_KEYS } from '../utils/constants';
import type { TopicQueryParams } from '../types';

export function useTopics(params?: TopicQueryParams) {
  return useQuery({
    queryKey: [...QUERY_KEYS.topics, params],
    queryFn: async () => {
      const { data } = await topicsApi.getTopics(params);
      return data;
    },
  });
}

export function useTopic(id: string) {
  return useQuery({
    queryKey: QUERY_KEYS.topic(id),
    queryFn: async () => {
      const { data } = await topicsApi.getTopic(id);
      return data;
    },
    enabled: !!id,
  });
}
