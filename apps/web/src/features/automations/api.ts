'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Automation, AutomationInput } from './types';

export const automationKeys = { byProject: (projectId: string) => ['automations', projectId] as const };

export function useAutomations(projectId: string) {
  return useQuery({ queryKey: automationKeys.byProject(projectId), queryFn: () => api.get<Automation[]>(`/projects/${projectId}/automations`) });
}

function useInvalidate(projectId: string) {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: automationKeys.byProject(projectId) });
}

export function useSaveAutomation(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: ({ id, ...input }: Partial<AutomationInput> & { id?: string }) =>
      id ? api.patch<Automation>(`/automations/${id}`, input) : api.post<Automation>(`/projects/${projectId}/automations`, input),
    meta: { successMessage: 'Automation saved' },
    onSuccess: invalidate,
  });
}

export function useToggleAutomation(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) => api.patch<Automation>(`/automations/${id}`, { isActive }),
    onSuccess: invalidate,
  });
}

export function useDeleteAutomation(projectId: string) {
  const invalidate = useInvalidate(projectId);
  return useMutation({
    mutationFn: (id: string) => api.delete(`/automations/${id}`),
    meta: { successMessage: 'Automation deleted' },
    onSuccess: invalidate,
  });
}
