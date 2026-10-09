'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Plan, PlanInput } from './types';

export const planKeys = {
  all: ['platform', 'plans'] as const,
  list: (includeInactive: boolean) => ['platform', 'plans', includeInactive] as const,
};

export function usePlans(includeInactive = false) {
  return useQuery({
    queryKey: planKeys.list(includeInactive),
    queryFn: () => api.get<Plan[]>('/platform/plans', { includeInactive }),
  });
}

/** Plan changes affect organization and subscription listings too. */
function useInvalidatePlatform() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['platform'] });
}

export function useSavePlan() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<PlanInput> & { id?: string }) =>
      id ? api.patch<Plan>(`/platform/plans/${id}`, input) : api.post<Plan>('/platform/plans', input),
    meta: { successMessage: 'Plan saved' },
    onSuccess: invalidate,
  });
}

export function useDeletePlan() {
  const invalidate = useInvalidatePlatform();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/platform/plans/${id}`),
    meta: { successMessage: 'Plan deleted' },
    onSuccess: invalidate,
  });
}
