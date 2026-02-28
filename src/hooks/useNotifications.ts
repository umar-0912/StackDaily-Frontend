import { useQuery } from '@tanstack/react-query';
import { notificationsApi } from '../api/notifications';
import { QUERY_KEYS } from '../utils/constants';

export function useNotificationHistory(page: number = 1) {
  return useQuery({
    queryKey: [...QUERY_KEYS.notificationHistory, page],
    queryFn: async () => {
      const { data } = await notificationsApi.getHistory({ page, limit: 10 });
      return data;
    },
  });
}
