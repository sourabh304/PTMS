'use client';

import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ProjectRole } from '@/shared/constants/domain';
import { api } from '@/shared/lib/api-client';
import type { Paginated } from '@/shared/types/api';
import type { Project, ProjectDashboard, ProjectDetail, ProjectInput, ProjectMember, ProjectQuery } from './types';

export const projectKeys = {
  all: ['projects'] as const,
  list: (query: ProjectQuery) => ['projects', 'list', query] as const,
  detail: (id: string) => ['projects', 'detail', id] as const,
  members: (id: string) => ['projects', 'members', id] as const,
  dashboard: (id: string) => ['projects', 'dashboard', id] as const,
};

export function useProjects(query: ProjectQuery = {}) {
  return useQuery({
    queryKey: projectKeys.list(query),
    queryFn: () => api.get<Paginated<Project>>('/projects', { ...query }),
    placeholderData: keepPreviousData,
  });
}

export function useProject(id: string) {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => api.get<ProjectDetail>(`/projects/${id}`),
    enabled: !!id,
  });
}

export function useProjectMembers(id: string | undefined) {
  return useQuery({
    queryKey: projectKeys.members(id ?? ''),
    queryFn: () => api.get<ProjectMember[]>(`/projects/${id}/members`),
    enabled: !!id,
  });
}

export function useProjectDashboard(id: string) {
  return useQuery({ queryKey: projectKeys.dashboard(id), queryFn: () => api.get<ProjectDashboard>(`/dashboard/projects/${id}`) });
}

export function useCreateProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: ProjectInput) => api.post<Project>('/projects', input),
    meta: { successMessage: 'Project created' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateProject(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Partial<ProjectInput>) => api.patch<Project>(`/projects/${id}`, input),
    meta: { successMessage: 'Project updated' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/projects/${id}`),
    meta: { successMessage: 'Project deleted' },
    // Mark stale without refetching: the deleted project's open queries would 404; lists refetch when next shown.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all, refetchType: 'none' }),
  });
}

export function useAddMembers(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { userIds: string[]; role: ProjectRole }) => api.post<ProjectMember[]>(`/projects/${projectId}/members`, input),
    meta: { successMessage: 'Members added' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}

export function useUpdateMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: string; role: ProjectRole }) => api.patch(`/projects/${projectId}/members/${userId}`, { role }),
    meta: { successMessage: 'Member role updated' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.members(projectId) }),
  });
}

export function useRemoveMember(projectId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) => api.delete(`/projects/${projectId}/members/${userId}`),
    meta: { successMessage: 'Member removed' },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: projectKeys.all }),
  });
}
