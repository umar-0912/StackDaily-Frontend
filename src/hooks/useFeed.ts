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
    mutationFn: (dailySelectionId: string) =>
      dailyApi.markRead({ dailySelectionId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.feed] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
    },
  });
}
