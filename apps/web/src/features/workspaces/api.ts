'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { CreateWorkspaceInput, Workspace } from './types';

export const workspaceKeys = { all: ['workspaces'] as const };

export function useWorkspaces() {
  return useQuery({ queryKey: workspaceKeys.all, queryFn: () => api.get<Workspace[]>('/workspaces') });
}

export function useCreateWorkspace() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateWorkspaceInput) => api.post('/workspaces', input),
    meta: { successMessage: 'Workspace created' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: workspaceKeys.all }),
  });
}
