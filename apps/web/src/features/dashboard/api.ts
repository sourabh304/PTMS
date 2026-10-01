'use client';

import { useQuery } from '@tanstack/react-query';
import type { Project } from '@/features/projects/types';
import { api } from '@/shared/lib/api-client';
import type { LookupCount, LookupRef, ProjectRef } from '@/shared/types/api';

export interface DashboardOverview {
  counts: {
    activeProjects: number;
    openTasks: number;
    overdueTasks: number;
    myOpenTasks: number;
    openIssues: number;
    myOpenIssues: number;
    completedThisWeek: number;
    minutesThisWeek: number;
  };
  tasksByStatus: LookupCount[];
  tasksByPriority: LookupCount[];
  upcomingMilestones: { id: string; name: string; dueDate: string; project: ProjectRef }[];
  myTasks: { id: string; number: number; title: string; dueDate: string | null; projectId: string; status: LookupRef; priority: LookupRef; project: ProjectRef }[];
  projects: Pick<Project, 'id' | 'name' | 'key' | 'color' | 'status' | 'owner' | 'endDate' | 'stats'>[];
}

export const dashboardKeys = {
  overview: ['dashboard', 'overview'] as const,
  navCounts: ['dashboard', 'nav-counts'] as const,
};

export function useDashboard() {
  return useQuery({ queryKey: dashboardKeys.overview, queryFn: () => api.get<DashboardOverview>('/dashboard') });
}

/** Badge counters for the sidebar; refreshed with any task/project change (shares the 'dashboard' key). */
export function useNavCounts() {
  return useQuery({
    queryKey: dashboardKeys.navCounts,
    queryFn: () => api.get<{ myOpenTasks: number; projects: number }>('/dashboard/nav-counts'),
    staleTime: 60_000,
  });
}
