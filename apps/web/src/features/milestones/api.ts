'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Milestone, MilestoneInput } from './types';

export const milestoneKeys = {
  all: ['milestones'] as const,
  list: (projectId?: string, completed?: boolean) => ['milestones', projectId ?? 'all', completed] as const,
};

export function useMilestones(projectId?: string, completed?: boolean) {
  return useQuery({
    queryKey: milestoneKeys.list(projectId, completed),
    queryFn: () => api.get<Milestone[]>('/milestones', { projectId, completed }),
  });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: milestoneKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['tasks', 'gantt'] });
    void queryClient.invalidateQueries({ queryKey: ['projects'] });
  };
}

export function useSaveMilestone() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, projectId, ...input }: Partial<MilestoneInput> & { id?: string; projectId: string }) =>
      id ? api.patch<Milestone>(`/milestones/${id}`, input) : api.post<Milestone>('/milestones', { ...input, projectId }),
    meta: { successMessage: 'Milestone saved' },
    onSuccess: invalidate,
  });
}

export function useDeleteMilestone() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/milestones/${id}`),
    meta: { successMessage: 'Milestone deleted' },
    onSuccess: invalidate,
  });
}
