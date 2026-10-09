import type { StatusCategory } from '@/shared/constants/domain';
import type { LookupRef, ProjectRef, UserSummary } from '@/shared/types/api';

export interface Task {
  id: string;
  projectId: string;
  taskListId: string | null;
  milestoneId: string | null;
  parentId: string | null;
  number: number;
  title: string;
  description: string | null;
  statusId: string;
  priorityId: string;
  startDate: string | null;
  dueDate: string | null;
  estimatedHours: number | null;
  progress: number;
  position: number;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  status: LookupRef;
  priority: LookupRef;
  project: ProjectRef;
  taskList: { id: string; name: string; color: string | null } | null;
  milestone: { id: string; name: string } | null;
  assignees: UserSummary[];
  _count: { subtasks: number; comments: number };
  /** Values of the project's custom columns, JSON-encoded. */
  customValues: { fieldId: string; value: string }[];
}

interface DependencyTask {
  id: string;
  number: number;
  title: string;
  status: LookupRef;
}

export interface TaskDetail extends Task {
  createdBy: UserSummary;
  parent: { id: string; number: number; title: string } | null;
  subtasks: (Pick<Task, 'id' | 'number' | 'title' | 'dueDate' | 'status' | 'priority' | 'assignees'>)[];
  predecessors: { id: string; type: string; predecessor: DependencyTask }[];
  successors: { id: string; type: string; successor: DependencyTask }[];
  loggedMinutes: number;
}

export interface TaskQuery {
  projectId?: string;
  statusId?: string;
  priorityId?: string;
  milestoneId?: string;
  taskListId?: string;
  assigneeId?: string;
  parentId?: string;
  statusCategory?: StatusCategory;
  mine?: boolean;
  rootOnly?: boolean;
  overdue?: boolean;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: 'position' | 'dueDate' | 'startDate' | 'createdAt' | 'updatedAt' | 'title' | 'number';
  sortOrder?: 'asc' | 'desc';
}

export interface TaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  statusId?: string;
  priorityId?: string;
  taskListId?: string | null;
  milestoneId?: string | null;
  parentId?: string | null;
  startDate?: string | null;
  dueDate?: string | null;
  estimatedHours?: number | null;
  progress?: number;
  assigneeIds?: string[];
}

export type TaskUpdate = Partial<Omit<TaskInput, 'projectId'>>;

export interface GanttData {
  project: { id: string; name: string; key: string; startDate: string | null; endDate: string | null };
  tasks: (Pick<Task, 'id' | 'number' | 'title' | 'parentId' | 'milestoneId' | 'taskListId' | 'startDate' | 'dueDate' | 'progress' | 'assignees'> & {
    status: LookupRef;
    priority: LookupRef;
  })[];
  milestones: { id: string; name: string; dueDate: string; startDate: string | null; completedAt: string | null }[];
  dependencies: { id: string; predecessorId: string; successorId: string; type: string }[];
}
