import type { StatusCategory } from '@/shared/constants/domain';
import type { LookupRef, ProjectRef, UserSummary } from '@/shared/types/api';

export interface Issue {
  id: string;
  projectId: string;
  number: number;
  title: string;
  description: string | null;
  statusId: string;
  priorityId: string;
  severityId: string;
  reporterId: string;
  assigneeId: string | null;
  milestoneId: string | null;
  taskId: string | null;
  dueDate: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: LookupRef;
  priority: LookupRef;
  severity: LookupRef;
  reporter: UserSummary;
  assignee: UserSummary | null;
  milestone: { id: string; name: string } | null;
  task: { id: string; number: number; title: string } | null;
  project: ProjectRef;
  _count: { comments: number };
}

export interface IssueQuery {
  projectId?: string;
  statusId?: string;
  priorityId?: string;
  severityId?: string;
  assigneeId?: string;
  statusCategory?: StatusCategory;
  mine?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

export interface IssueInput {
  projectId: string;
  title: string;
  description?: string | null;
  statusId?: string;
  priorityId?: string;
  severityId?: string;
  assigneeId?: string | null;
  milestoneId?: string | null;
  dueDate?: string | null;
}
