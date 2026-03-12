import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyApi } from '../api/daily';
import { QUERY_KEYS } from '../utils/constants';

export function useFeed() {
  return useQuery({
    queryKey: QUERY_KEYS.feed,
    queryFn: async () => {
      const { data } = await dailyApi.getFeed();
      return data;
    },
  });
}

export function useMarkRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ dailySelectionId, topicId }: { dailySelectionId: string; topicId: string }) =>
      dailyApi.markRead({ dailySelectionId, topicId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.feed] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.progress] });
    },
  });
}

export function useNextQuestion() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ topicId }: { topicId: string }) =>
      dailyApi.getNextQuestion({ topicId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.feed] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.progress] });
    },
  });
}
