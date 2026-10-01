'use client';

import { Activity, BarChartHorizontal, Bug, Clock, Flag, KanbanSquare, LayoutDashboard, ListChecks, Settings } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate } from '@/shared/lib/utils';
import { Badge, ColorBadge } from '@/shared/ui/badge';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { LinkTabs, ProgressBar, type TabItem } from '@/shared/ui/layout';
import { useProject } from '../api';

const icon = 'h-4 w-4';

function projectTabs(id: string, canManage: boolean): TabItem[] {
  return [
    { href: routes.project(id), label: 'Overview', icon: <LayoutDashboard className={icon} />, exact: true },
    { href: routes.projectTasks(id), label: 'Tasks', icon: <ListChecks className={icon} /> },
    { href: routes.projectBoard(id), label: 'Board', icon: <KanbanSquare className={icon} /> },
    { href: routes.projectGantt(id), label: 'Gantt', icon: <BarChartHorizontal className={icon} /> },
    { href: routes.projectMilestones(id), label: 'Milestones', icon: <Flag className={icon} /> },
    { href: routes.projectIssues(id), label: 'Issues', icon: <Bug className={icon} /> },
    { href: routes.projectTimesheets(id), label: 'Timesheets', icon: <Clock className={icon} /> },
    { href: routes.projectActivity(id), label: 'Activity', icon: <Activity className={icon} /> },
    ...(canManage ? [{ href: routes.projectSettings(id), label: 'Settings', icon: <Settings className={icon} /> }] : []),
  ];
}

export function ProjectWorkspace({ projectId, children }: { projectId: string; children: ReactNode }) {
  const { data: project, isLoading, isError, error, refetch } = useProject(projectId);

  if (isLoading) return <Spinner />;
  if (isError || !project) return <ErrorState message={errorMessage(error, 'Project not found')} onRetry={refetch} />;

  return (
    <div>
      <div className="mb-1 text-xs text-muted">
        <Link href={routes.projects} className="hover:text-brand">
          Projects
        </Link>{' '}
        / {project.key}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span className="h-9 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
          <div className="min-w-0">
            <h1 className="flex items-center gap-2 truncate text-xl font-semibold tracking-tight">
              {project.name}
              <ColorBadge color={project.status.color} label={project.status.name} />
              {project.isArchived && <Badge tone="warning">Archived</Badge>}
              {!project.access.canEdit && <Badge>Read only</Badge>}
            </h1>
            <p className="text-xs text-muted">
              {formatDate(project.startDate)} → {formatDate(project.endDate)}
            </p>
          </div>
        </div>
        <div className="flex w-56 items-center gap-2">
          <ProgressBar value={project.stats.progress} color={project.color ?? undefined} />
          <span className="text-sm font-semibold">{project.stats.progress}%</span>
        </div>
      </div>
      <LinkTabs className="mt-4" items={projectTabs(project.id, project.access.canManage)} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
