'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Task } from '@/features/tasks/types';
import { api } from '@/shared/lib/api-client';
import type { Paginated } from '@/shared/types/api';
import type { CustomField, CustomFieldInput } from './types';

export const customFieldKeys = { byProject: (projectId: string) => ['custom-fields', projectId] as const };

export function useCustomFields(projectId: string) {
  return useQuery({ queryKey: customFieldKeys.byProject(projectId), queryFn: () => api.get<CustomField[]>(`/projects/${projectId}/custom-fields`) });
}

export function useSaveCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...input }: CustomFieldInput & { id?: string }) =>
      id ? api.patch<CustomField>(`/custom-fields/${id}`, input) : api.post<CustomField>(`/projects/${projectId}/custom-fields`, input),
    meta: { successMessage: 'Column saved' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: customFieldKeys.byProject(projectId) }),
  });
}

export function useDeleteCustomField(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/custom-fields/${id}`),
    meta: { successMessage: 'Column deleted' },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: customFieldKeys.byProject(projectId) });
      void queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
}

type ListSnapshot = [readonly unknown[], Paginated<Task> | undefined][];

/** Saves a cell; the new value shows immediately and is rolled back if the API rejects it. */
export function useSetCustomValue() {
  const queryClient = useQueryClient();
  const listKey = ['tasks', 'list'];
  return useMutation({
    mutationFn: ({ taskId, fieldId, value }: { taskId: string; fieldId: string; value: unknown }) =>
      api.put<{ fieldId: string; value: string | null }>(`/tasks/${taskId}/custom-fields/${fieldId}`, { value }),
    onMutate: async ({ taskId, fieldId, value }): Promise<{ snapshot: ListSnapshot }> => {
      await queryClient.cancelQueries({ queryKey: listKey });
      const snapshot = queryClient.getQueriesData<Paginated<Task>>({ queryKey: listKey });
      const empty = value === null || value === undefined || value === '' || value === false || (Array.isArray(value) && !value.length);
      queryClient.setQueriesData<Paginated<Task>>({ queryKey: listKey }, (page) =>
        page
          ? {
              ...page,
              data: page.data.map((task) => {
                if (task.id !== taskId) return task;
                const others = (task.customValues ?? []).filter((v) => v.fieldId !== fieldId);
                return { ...task, customValues: empty ? others : [...others, { fieldId, value: JSON.stringify(value) }] };
              }),
            }
          : page,
      );
      return { snapshot };
    },
    onError: (_error, _variables, context) => context?.snapshot.forEach(([key, data]) => queryClient.setQueryData(key, data)),
    onSettled: (_data, _error, { taskId }) => queryClient.invalidateQueries({ queryKey: ['tasks', 'detail', taskId] }),
  });
}
