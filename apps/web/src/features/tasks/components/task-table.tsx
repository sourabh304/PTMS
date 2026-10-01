'use client';

import { GitBranch, MessageSquare } from 'lucide-react';
import { StatusCategory } from '@/shared/constants/domain';
import { cn, formatDate, isOverdue } from '@/shared/lib/utils';
import { AvatarGroup } from '@/shared/ui/avatar';
import { ColorBadge } from '@/shared/ui/badge';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import type { Task } from '../types';

interface TaskTableProps {
  tasks: Task[];
  onOpen: (task: Task) => void;
  showProject?: boolean;
}

export function TaskTable({ tasks, onOpen, showProject }: TaskTableProps) {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-24">ID</Th>
          <Th>Task</Th>
          {showProject && <Th>Project</Th>}
          <Th>Status</Th>
          <Th>Priority</Th>
          <Th>Assignees</Th>
          <Th>Due</Th>
          <Th className="w-36">Progress</Th>
        </tr>
      </thead>
      <tbody>
        {tasks.map((task) => {
          const closed = task.status.category === StatusCategory.CLOSED;
          const overdue = isOverdue(task.dueDate, closed);
          return (
            <Tr key={task.id} className="cursor-pointer" onClick={() => onOpen(task)}>
              <Td className="whitespace-nowrap text-xs font-medium text-muted">
                {task.project.key}-{task.number}
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <span className={cn('font-medium', closed && 'text-muted line-through')}>{task.title}</span>
                  {task._count.subtasks > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted" title="Subtasks">
                      <GitBranch className="h-3 w-3" /> {task._count.subtasks}
                    </span>
                  )}
                  {task._count.comments > 0 && (
                    <span className="inline-flex items-center gap-0.5 text-xs text-muted" title="Comments">
                      <MessageSquare className="h-3 w-3" /> {task._count.comments}
                    </span>
                  )}
                </div>
                {task.milestone && <p className="text-xs text-muted">⚑ {task.milestone.name}</p>}
              </Td>
              {showProject && (
                <Td className="whitespace-nowrap text-sm">
                  <span className="mr-1.5 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: task.project.color ?? 'var(--brand)' }} />
                  {task.project.name}
                </Td>
              )}
              <Td>
                <ColorBadge color={task.status.color} label={task.status.name} />
              </Td>
              <Td>
                <ColorBadge color={task.priority.color} label={task.priority.name} variant="dot" />
              </Td>
              <Td>
                <AvatarGroup users={task.assignees} />
              </Td>
              <Td className={cn('whitespace-nowrap text-sm', overdue ? 'font-medium text-danger' : 'text-muted')}>{formatDate(task.dueDate)}</Td>
              <Td>
                <div className="flex items-center gap-2">
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                    <div className="h-full rounded-full bg-brand" style={{ width: `${task.progress}%` }} />
                  </div>
                  <span className="w-8 text-right text-xs text-muted">{task.progress}%</span>
                </div>
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
