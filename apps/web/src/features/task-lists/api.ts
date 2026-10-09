'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/shared/lib/api-client';

export interface TaskList {
  id: string;
  projectId: string;
  milestoneId: string | null;
  name: string;
  /** Group color (hex); older groups may not have one. */
  color: string | null;
  position: number;
  milestone: { id: string; name: string } | null;
  _count: { tasks: number };
}

export const taskListKeys = {
  byProject: (projectId: string) => ['task-lists', projectId] as const,
};

export function useTaskLists(projectId: string | undefined) {
  return useQuery({
    queryKey: taskListKeys.byProject(projectId ?? ''),
    queryFn: () => api.get<TaskList[]>('/task-lists', { projectId }),
    enabled: !!projectId,
  });
}

export function useSaveTaskList(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: { id?: string; name?: string; color?: string; milestoneId?: string | null }) =>
      id ? api.patch<TaskList>(`/task-lists/${id}`, input) : api.post<TaskList>('/task-lists', { ...input, projectId }),
    meta: { successMessage: 'Group saved' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: taskListKeys.byProject(projectId) }),
  });
}

export function useDeleteTaskList(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/task-lists/${id}`),
    meta: { successMessage: 'Group deleted - its tasks were kept' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: taskListKeys.byProject(projectId) });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}
