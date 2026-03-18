import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { QUERY_KEYS } from '../utils/constants';
import { useAuthStore } from '../stores/authStore';
import type { UpdateProfileRequest, UpdateSubscriptionsRequest, SubscriptionInfo, UnsubscribeTopicRequest, UnsubscribeTopicResponse } from '../types';

export function useProfile() {
  return useQuery({
    queryKey: QUERY_KEYS.profile,
    queryFn: async () => {
      const { data } = await usersApi.getProfile();
      return data;
    },
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateProfileRequest) => {
      const { data: updatedUser } = await usersApi.updateProfile(data);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
    },
  });
}

export function useSubscriptionInfo() {
  return useQuery({
    queryKey: QUERY_KEYS.subscription,
    queryFn: async () => {
      const { data } = await usersApi.getSubscriptionInfo();
      return data;
    },
  });
}

export function useUpdateSubscriptions() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UpdateSubscriptionsRequest) => {
      const { data: updatedUser } = await usersApi.updateSubscriptions(data);
      return updatedUser;
    },
    onSuccess: (updatedUser) => {
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.topics] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.feed] });
    },
  });
}

export function useUnsubscribeTopic() {
  const queryClient = useQueryClient();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: async (data: UnsubscribeTopicRequest) => {
      const { data: result } = await usersApi.unsubscribeTopic(data);
      return result;
    },
    onSuccess: async () => {
      // Refetch profile to sync auth store (unsubscribe API doesn't return updated user)
      const { data: freshUser } = await usersApi.getProfile();
      setUser(freshUser);
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.profile] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.topics] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.feed] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.progress] });
      queryClient.invalidateQueries({ queryKey: [...QUERY_KEYS.subscription] });
    },
  });
}
