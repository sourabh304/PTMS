'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';
import type { Paginated } from '@/shared/types/api';
import type { Issue, IssueInput, IssueQuery } from './types';

export const issueKeys = {
  all: ['issues'] as const,
  list: (query: IssueQuery) => ['issues', 'list', query] as const,
  detail: (id: string) => ['issues', 'detail', id] as const,
};

export function useIssues(query: IssueQuery) {
  return useQuery({
    queryKey: issueKeys.list(query),
    queryFn: () => api.get<Paginated<Issue>>('/issues', { ...query }),
    placeholderData: keepPreviousData,
  });
}

export function useIssue(id: string | null) {
  return useQuery({ queryKey: issueKeys.detail(id ?? ''), queryFn: () => api.get<Issue>(`/issues/${id}`), enabled: !!id });
}

function useInvalidate() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: issueKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['projects', 'dashboard'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useSaveIssue() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: ({ id, projectId, ...input }: Partial<IssueInput> & { id?: string; projectId: string }) =>
      id ? api.patch<Issue>(`/issues/${id}`, input) : api.post<Issue>('/issues', { ...input, projectId }),
    onSuccess: invalidate,
  });
}

export function useDeleteIssue() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/issues/${id}`),
    meta: { successMessage: 'Issue deleted' },
    onSuccess: invalidate,
  });
}
