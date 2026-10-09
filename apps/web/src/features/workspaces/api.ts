'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CreateWorkspaceInput, Workspace } from './types';

export const workspaceKeys = {
  all: ['workspaces'] as const,
};

export function useWorkspaces(enabled = true) {
  return useQuery({ queryKey: workspaceKeys.all, queryFn: () => api.get<Workspace[]>('/workspaces'), enabled });
}

export function useDeleteWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete<Workspace>(`/workspaces/${id}`),
    meta: { successMessage: 'Workspace deleted' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
}

export function useRestoreWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.post<Workspace>(`/workspaces/${id}/restore`),
    meta: { successMessage: 'Workspace restored' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => api.post<Workspace>('/workspaces', input),
    meta: { successMessage: 'Workspace created' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
}
