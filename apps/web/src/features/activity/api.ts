'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { appConfig } from '@/shared/config/env';
import { api } from '@/shared/lib/api-client';
import type { Paginated, ProjectRef, UserSummary } from '@/shared/types/api';

export interface Activity {
  id: string;
  projectId: string | null;
  entityType: string;
  entityId: string;
  action: string;
  summary: string;
  createdAt: string;
  actor: UserSummary;
  project: ProjectRef | null;
}

export const activityKeys = {
  all: ['activities'] as const,
  list: (projectId?: string, pageSize?: number) => ['activities', projectId ?? 'all', pageSize] as const,
};

export function useActivities(projectId?: string, pageSize: number = appConfig.defaultPageSize) {
  return useInfiniteQuery({
    queryKey: activityKeys.list(projectId, pageSize),
    queryFn: ({ pageParam }) => api.get<Paginated<Activity>>('/activities', { projectId, page: pageParam, limit: pageSize }),
    initialPageParam: 1,
    getNextPageParam: (last) => (last.meta.page < last.meta.totalPages ? last.meta.page + 1 : undefined),
  });
}
