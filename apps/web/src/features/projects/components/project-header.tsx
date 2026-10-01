'use client';

import {
  Activity,
  BarChartHorizontal,
  Bug,
  CalendarDays,
  ChevronRight,
  Clock,
  Flag,
  KanbanSquare,
  LayoutDashboard,
  ListChecks,
  Settings,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, fullName } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge, ColorBadge } from '@/shared/ui/badge';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { LinkTabs, ProgressBar, type TabItem } from '@/shared/ui/layout';
import { useProject } from '../api';

const icon = 'size-4';

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
      <nav aria-label="Breadcrumb" className="mb-2 flex items-center gap-1.5 text-xs font-medium text-muted">
        <Link href={routes.projects} className="transition-colors hover:text-foreground">
          Projects
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="font-mono text-foreground-soft">{project.key}</span>
      </nav>
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex min-w-0 items-start gap-3">
          <span className="mt-1.5 size-3 shrink-0 rounded-[4px]" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="truncate text-xl font-semibold tracking-tight sm:text-2xl">{project.name}</h1>
              <ColorBadge color={project.status.color} label={project.status.name} />
              {project.isArchived && <Badge tone="warning">Archived</Badge>}
              {!project.access.canEdit && <Badge>Read only</Badge>}
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays className="size-3.5" />
                {formatDate(project.startDate)} – {formatDate(project.endDate)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Avatar user={project.owner} size="xs" className="ring-0" />
                {fullName(project.owner)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <Users className="size-3.5" />
                {project._count.members} members
              </span>
            </div>
          </div>
        </div>
        <div className="w-full md:w-64">
          <div className="mb-1.5 flex justify-between text-xs">
            <span className="text-muted">
              {project.stats.completedTasks} of {project.stats.totalTasks} tasks done
            </span>
            <span className="font-semibold tabular-nums text-foreground">{project.stats.progress}%</span>
          </div>
          <ProgressBar value={project.stats.progress} color={project.color ?? undefined} />
        </div>
      </div>
      <LinkTabs className="mt-6" items={projectTabs(project.id, project.access.canManage)} />
      <div className="pt-6">{children}</div>
    </div>
  );
}
