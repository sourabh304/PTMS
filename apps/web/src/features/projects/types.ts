import type { ProjectHealth, ProjectRole, StatusCategory } from '@/shared/constants/domain';
import type { LookupCount, LookupRef, UserSummary } from '@/shared/types/api';

export interface ProjectStats {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  overdueTasks: number;
  progress: number;
}

export interface Project {
  id: string;
  key: string;
  name: string;
  description: string | null;
  color: string | null;
  statusId: string;
  status: LookupRef;
  ownerId: string;
  owner: UserSummary;
  startDate: string | null;
  endDate: string | null;
  budgetHours: number | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  _count: { members: number; milestones: number; issues: number };
  /** First few members, for avatar previews. */
  members: { user: UserSummary }[];
  stats: ProjectStats;
  /** Present on list results. */
  loggedMinutes?: number;
  health?: ProjectHealth;
}

export interface ProjectSummary {
  total: number;
  archived: number;
  byCategory: Record<StatusCategory, number>;
  members: number;
  projectsWithOverdue: number;
  overdueTasks: number;
}

export interface ProjectDetail extends Project {
  access: { role: ProjectRole | null; canEdit: boolean; canManage: boolean };
}

export interface ProjectMember {
  id: string;
  projectId: string;
  userId: string;
  role: ProjectRole;
  createdAt: string;
  user: UserSummary & { jobTitle: string | null; isActive: boolean };
}

export interface ProjectQuery {
  page?: number;
  limit?: number;
  search?: string;
  statusId?: string;
  statusCategory?: StatusCategory;
  archived?: boolean;
  sortBy?: 'name' | 'createdAt' | 'updatedAt' | 'endDate' | 'key';
  sortOrder?: 'asc' | 'desc';
}

export interface ProjectInput {
  name: string;
  key: string;
  description?: string | null;
  color?: string | null;
  statusId?: string;
  ownerId?: string;
  startDate?: string | null;
  endDate?: string | null;
  budgetHours?: number | null;
  memberIds?: string[];
  isArchived?: boolean;
}

export interface ProjectDashboard {
  project: { id: string; name: string; budgetHours: number | null; endDate: string | null };
  stats: ProjectStats;
  loggedMinutes: number;
  billableMinutes: number;
  estimatedHours: number;
  tasksByStatus: LookupCount[];
  tasksByPriority: LookupCount[];
  issuesByStatus: LookupCount[];
  issuesBySeverity: LookupCount[];
  workload: { user: UserSummary; role: ProjectRole; openTasks: number; overdueTasks: number }[];
  milestones: {
    total: number;
    completed: number;
    overdue: number;
    next: { id: string; name: string; dueDate: string } | null;
  };
}
