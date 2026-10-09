import { Prisma } from '@prisma/client';
import { USER_SUMMARY_SELECT } from '../users/users.select';

const LOOKUP_SELECT = { id: true, name: true, color: true, category: true } satisfies Prisma.LookupSelect;

export const TASK_LIST_INCLUDE = {
  status: { select: LOOKUP_SELECT },
  priority: { select: LOOKUP_SELECT },
  project: { select: { id: true, name: true, key: true, color: true } },
  taskList: { select: { id: true, name: true, color: true } },
  milestone: { select: { id: true, name: true } },
  assignees: { select: { user: { select: USER_SUMMARY_SELECT } } },
  _count: { select: { subtasks: true, comments: true } },
} satisfies Prisma.TaskInclude;

const DEPENDENCY_TASK_SELECT = {
  id: true,
  number: true,
  title: true,
  status: { select: LOOKUP_SELECT },
} satisfies Prisma.TaskSelect;

export const TASK_DETAIL_INCLUDE = {
  ...TASK_LIST_INCLUDE,
  createdBy: { select: USER_SUMMARY_SELECT },
  parent: { select: { id: true, number: true, title: true } },
  subtasks: {
    include: {
      status: { select: LOOKUP_SELECT },
      priority: { select: LOOKUP_SELECT },
      assignees: { select: { user: { select: USER_SUMMARY_SELECT } } },
    },
    orderBy: { number: 'asc' },
  },
  predecessors: { include: { predecessor: { select: DEPENDENCY_TASK_SELECT } } },
  successors: { include: { successor: { select: DEPENDENCY_TASK_SELECT } } },
} satisfies Prisma.TaskInclude;
