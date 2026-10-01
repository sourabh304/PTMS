import type { ProjectRef, UserSummary } from '@/shared/types/api';

export interface Milestone {
  id: string;
  projectId: string;
  name: string;
  description: string | null;
  startDate: string | null;
  dueDate: string;
  ownerId: string | null;
  completedAt: string | null;
  createdAt: string;
  owner: UserSummary | null;
  project: ProjectRef;
  _count: { issues: number };
  stats: { totalTasks: number; completedTasks: number; progress: number };
}

export interface MilestoneInput {
  projectId: string;
  name: string;
  description?: string | null;
  startDate?: string | null;
  dueDate: string;
  ownerId?: string | null;
  completed?: boolean;
}
