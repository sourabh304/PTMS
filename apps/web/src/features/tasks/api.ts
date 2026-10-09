'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { projectKeys } from '@/features/projects/api';
import { api } from '@/shared/lib/api-client';
import type { Paginated } from '@/shared/types/api';
import type { GanttData, Task, TaskDetail, TaskInput, TaskQuery, TaskUpdate } from './types';

export const taskKeys = {
  all: ['tasks'] as const,
  list: (query: TaskQuery) => ['tasks', 'list', query] as const,
  detail: (id: string) => ['tasks', 'detail', id] as const,
  gantt: (projectId: string) => ['tasks', 'gantt', projectId] as const,
};

export function useTasks(query: TaskQuery, enabled = true) {
  return useQuery({
    queryKey: taskKeys.list(query),
    queryFn: () => api.get<Paginated<Task>>('/tasks', { ...query }),
    placeholderData: keepPreviousData,
    enabled,
  });
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: taskKeys.detail(id ?? ''),
    queryFn: () => api.get<TaskDetail>(`/tasks/${id}`),
    enabled: !!id,
  });
}

export function useGantt(projectId: string) {
  return useQuery({ queryKey: taskKeys.gantt(projectId), queryFn: () => api.get<GanttData>('/tasks/gantt', { projectId }) });
}

/** Task changes affect project progress and dashboards too. */
function useInvalidateTaskData() {
  const queryClient = useQueryClient();
  return () => {
    void queryClient.invalidateQueries({ queryKey: taskKeys.all });
    void queryClient.invalidateQueries({ queryKey: projectKeys.all });
    void queryClient.invalidateQueries({ queryKey: ['milestones'] });
    void queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  };
}

export function useCreateTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: (input: TaskInput) => api.post<Task>('/tasks', input),
    meta: { successMessage: 'Task created' },
    onSuccess: invalidate,
  });
}

export function useUpdateTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ id, ...input }: TaskUpdate & { id: string }) => api.patch<Task>(`/tasks/${id}`, input),
    onSuccess: invalidate,
  });
}

interface QuickUpdate {
  id: string;
  input: TaskUpdate;
  /** Fields to show immediately in cached task lists while the request runs. */
  preview: Partial<Task>;
}

type TaskListSnapshot = [readonly unknown[], Paginated<Task> | undefined][];

/**
 * Inline edits from tables: the change appears instantly (optimistic update)
 * and is rolled back if the API rejects it.
 */
export function useQuickUpdateTask() {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateTaskData();
  const listKey = ['tasks', 'list'];
  return useMutation({
    mutationFn: ({ id, input }: QuickUpdate) => api.patch<Task>(`/tasks/${id}`, input),
    onMutate: async ({ id, preview }): Promise<{ snapshot: TaskListSnapshot }> => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const snapshot = queryClient.getQueriesData<Paginated<Task>>({ queryKey: listKey });
      queryClient.setQueriesData<Paginated<Task>>({ queryKey: listKey }, (page) =>
        page ? { ...page, data: page.data.map((task) => (task.id === id ? { ...task, ...preview } : task)) } : page,
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: invalidate,
  });
}

export function useMoveTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ id, statusId, position }: { id: string; statusId: string; position: number }) =>
      api.patch<Task>(`/tasks/${id}/move`, { statusId, position }),
    onSettled: invalidate,
  });
}

export function useDeleteTask() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/tasks/${id}`),
    meta: { successMessage: 'Task deleted' },
    onSuccess: invalidate,
  });
}

export function useAddDependency() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ taskId, predecessorId }: { taskId: string; predecessorId: string }) =>
      api.post(`/tasks/${taskId}/dependencies`, { predecessorId }),
    meta: { successMessage: 'Dependency added' },
    onSuccess: invalidate,
  });
}

export function useRemoveDependency() {
  const invalidate = useInvalidateTaskData();
  return useMutation({
    mutationFn: ({ taskId, dependencyId }: { taskId: string; dependencyId: string }) =>
      api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`),
    onSuccess: invalidate,
  });
}
