'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Paginated } from '@/shared/types/api';
import type { Subscription, SubscriptionInput, SubscriptionOverview, SubscriptionQuery } from './types';

export const subscriptionKeys = {
  list: (query: SubscriptionQuery) => ['platform', 'subscriptions', query] as const,
  current: ['subscription', 'current'] as const,
};

export function useSubscriptions(query: SubscriptionQuery) {
  return useQuery({
    queryKey: subscriptionKeys.list(query),
    queryFn: () => api.get<Paginated<Subscription>>('/platform/subscriptions', { ...query }),
    placeholderData: keepPreviousData,
  });
}

/** The signed-in organization's own plan and usage (read-only). */
export function useCurrentSubscription(enabled = true) {
  return useQuery({
    queryKey: subscriptionKeys.current,
    queryFn: () => api.get<SubscriptionOverview>('/subscription'),
    enabled,
  });
}

export function useSaveSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, organizationId, ...input }: Partial<SubscriptionInput> & { id?: string }) =>
      id
        ? api.patch<Subscription>(`/platform/subscriptions/${id}`, input)
        : api.post<Subscription>('/platform/subscriptions', { ...input, organizationId }),
    meta: { successMessage: 'Subscription saved' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  });
}

export function useDeleteSubscription() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/platform/subscriptions/${id}`),
    meta: { successMessage: 'Subscription deleted' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['platform'] }),
  });
}
