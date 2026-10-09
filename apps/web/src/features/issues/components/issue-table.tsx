'use client';

import { MessageSquare } from 'lucide-react';
import { StatusCategory } from '@/shared/constants/domain';
import { cn, formatDate, fullName, isOverdue } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { ColorBadge } from '@/shared/ui/badge';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import type { Issue } from '../types';

export const issueRef = (issue: Pick<Issue, 'number' | 'project'>) => `${issue.project.key}-BUG-${issue.number}`;

export function IssueTable({ issues, onOpen, showProject }: { issues: Issue[]; onOpen: (issue: Issue) => void; showProject?: boolean }) {
  return (
    <Table>
      <thead>
        <tr>
          <Th className="w-28">ID</Th>
          <Th>Issue</Th>
          {showProject && <Th>Project</Th>}
          <Th>Status</Th>
          <Th>Severity</Th>
          <Th>Priority</Th>
          <Th>Assignee</Th>
          <Th>Due</Th>
        </tr>
      </thead>
      <tbody>
        {issues.map((issue) => {
          const closed = issue.status.category === StatusCategory.CLOSED;
          return (
            <Tr key={issue.id} className="cursor-pointer" onClick={() => onOpen(issue)}>
              <Td className="whitespace-nowrap font-mono text-xs text-muted">{issueRef(issue)}</Td>
              <Td>
                <span className={cn('font-medium', closed && 'text-muted line-through')}>{issue.title}</span>
                {issue._count.comments > 0 && (
                  <span className="ml-2 inline-flex items-center gap-0.5 text-xs text-muted">
                    <MessageSquare className="size-3" /> {issue._count.comments}
                  </span>
                )}
                <p className="text-xs text-muted">Reported by {fullName(issue.reporter)}</p>
              </Td>
              {showProject && <Td className="whitespace-nowrap">{issue.project.name}</Td>}
              <Td>
                <ColorBadge color={issue.status.color} label={issue.status.name} />
              </Td>
              <Td>
                <ColorBadge color={issue.severity.color} label={issue.severity.name} />
              </Td>
              <Td>
                <ColorBadge color={issue.priority.color} label={issue.priority.name} variant="dot" />
              </Td>
              <Td>
                {issue.assignee ? (
                  <span className="flex items-center gap-2 whitespace-nowrap">
                    <Avatar user={issue.assignee} size="xs" /> {fullName(issue.assignee)}
                  </span>
                ) : (
                  <span className="text-xs text-muted">Unassigned</span>
                )}
              </Td>
              <Td className={cn('whitespace-nowrap text-sm', isOverdue(issue.dueDate, closed) ? 'font-medium text-danger' : 'text-muted')}>
                {formatDate(issue.dueDate)}
              </Td>
            </Tr>
          );
        })}
      </tbody>
    </Table>
  );
}
