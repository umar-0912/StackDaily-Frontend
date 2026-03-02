import { useQuery } from '@tanstack/react-query';
import { progressApi } from '../api/progress';
import { QUERY_KEYS } from '../utils/constants';

export function useProgress() {
  return useQuery({
    queryKey: QUERY_KEYS.progress,
    queryFn: async () => {
      const { data } = await progressApi.getAll();
      return data;
    },
  });
}

export function useTopicProgress(topicId: string) {
  return useQuery({
    queryKey: QUERY_KEYS.topicProgress(topicId),
    queryFn: async () => {
      const { data } = await progressApi.getByTopic(topicId);
      return data;
    },
    enabled: !!topicId,
  });
}
