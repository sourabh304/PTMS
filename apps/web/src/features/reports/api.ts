'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProjectStats } from '@/features/projects/types';
import type { ProjectHealth } from '@/shared/constants/domain';
import { api } from '@/shared/lib/api-client';
import type { LookupCount, LookupRef, UserSummary } from '@/shared/types/api';

export interface ReportRange {
  from?: string;
  to?: string;
  projectId?: string;
}

export interface WorkloadReport {
  from: string;
  to: string;
  capacityMinutes: number;
  rows: {
    user: UserSummary & { jobTitle: string | null };
    openTasks: number;
    overdueTasks: number;
    estimatedHours: number;
    loggedMinutes: number;
    utilization: number;
  }[];
}

export interface PortfolioRow {
  id: string;
  name: string;
  key: string;
  color: string | null;
  status: LookupRef;
  owner: UserSummary;
  startDate: string | null;
  endDate: string | null;
  budgetHours: number | null;
  loggedMinutes: number;
  openIssues: number;
  stats: ProjectStats;
  health: ProjectHealth;
}

export interface IssueReport {
  from: string;
  to: string;
  byStatus: LookupCount[];
  bySeverity: LookupCount[];
  byPriority: LookupCount[];
  trend: { week: string; created: number; resolved: number }[];
}

export const reportKeys = {
  workload: (range: ReportRange) => ['reports', 'workload', range] as const,
  portfolio: ['reports', 'portfolio'] as const,
  issues: (range: ReportRange) => ['reports', 'issues', range] as const,
};

export const useWorkloadReport = (range: ReportRange) =>
  useQuery({ queryKey: reportKeys.workload(range), queryFn: () => api.get<WorkloadReport>('/reports/workload', { ...range }) });

export const usePortfolioReport = () =>
  useQuery({ queryKey: reportKeys.portfolio, queryFn: () => api.get<PortfolioRow[]>('/reports/projects') });

export const useIssueReport = (range: ReportRange) =>
  useQuery({ queryKey: reportKeys.issues(range), queryFn: () => api.get<IssueReport>('/reports/issues', { ...range }) });
