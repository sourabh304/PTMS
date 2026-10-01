import type { ApprovalStatus } from '@/shared/constants/domain';
import type { ProjectRef, UserSummary } from '@/shared/types/api';

export interface TimeEntry {
  id: string;
  userId: string;
  projectId: string;
  taskId: string | null;
  issueId: string | null;
  date: string;
  minutes: number;
  notes: string | null;
  isBillable: boolean;
  approvalStatus: ApprovalStatus;
  approvedAt: string | null;
  user: UserSummary;
  approvedBy: UserSummary | null;
  project: ProjectRef;
  task: { id: string; number: number; title: string } | null;
  issue: { id: string; number: number; title: string } | null;
}

export interface TimeEntryQuery {
  userId?: string;
  projectId?: string;
  taskId?: string;
  approvalStatus?: ApprovalStatus;
  mine?: boolean;
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
}

export interface TimeEntryInput {
  projectId: string;
  taskId?: string | null;
  issueId?: string | null;
  date: string;
  minutes: number;
  notes?: string | null;
  isBillable?: boolean;
}

export interface TimeSummary {
  totalMinutes: number;
  billableMinutes: number;
  entries: number;
  byDay: { date: string; minutes: number }[];
  byProject: { project: ProjectRef; minutes: number }[];
  byUser: { user: UserSummary; minutes: number }[];
}
