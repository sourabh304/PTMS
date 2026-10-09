'use client';

import { Activity, BarChartHorizontal, Bug, CalendarDays, Clock, Flag, KanbanSquare, LayoutDashboard, Settings, Star, Table2, UserPlus, Users } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatShortDate } from '@/shared/lib/utils';
import { AvatarGroup } from '@/shared/ui/avatar';
import { Badge, ColorBadge } from '@/shared/ui/badge';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { LinkTabs, type TabItem } from '@/shared/ui/layout';
import { useProject, useToggleFavorite } from '../api';
import type { ProjectDetail } from '../types';

const icon = 'size-4';

/** Views of a project, in tab order; the main table is the project's home. */
function projectViews(id: string, canManage: boolean): TabItem[] {
  return [
    { href: routes.project(id), label: 'Main table', icon: <Table2 className={icon} />, exact: true },
    { href: routes.projectBoard(id), label: 'Kanban', icon: <KanbanSquare className={icon} /> },
    { href: routes.projectGantt(id), label: 'Gantt', icon: <BarChartHorizontal className={icon} /> },
    { href: routes.projectCalendar(id), label: 'Calendar', icon: <CalendarDays className={icon} /> },
    { href: routes.projectWorkload(id), label: 'Workload', icon: <Users className={icon} /> },
    { href: routes.projectOverview(id), label: 'Dashboard', icon: <LayoutDashboard className={icon} /> },
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
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <span className="size-3.5 shrink-0 rounded" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
            <h1 className="truncate text-2xl font-semibold tracking-tight">{project.name}</h1>
            <FavoriteButton project={project} />
            <ColorBadge color={project.status.color} label={project.status.name} />
            {project.isArchived && <Badge tone="warning">Archived</Badge>}
            {!project.access.canEdit && <Badge>Read only</Badge>}
          </div>
          <p className="mt-1 max-w-3xl truncate text-sm text-muted">
            {project.description || `${project.key} · ${formatShortDate(project.startDate)} – ${formatShortDate(project.endDate)}`}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right text-xs text-muted">
            <span className="font-semibold tabular-nums text-foreground">{project.stats.progress}%</span> done ·{' '}
            {project.stats.completedTasks}/{project.stats.totalTasks} tasks
          </div>
          <AvatarGroup users={project.members.map((m) => m.user)} max={4} size="sm" />
          {project.access.canManage && (
            <Link
              href={routes.projectSettings(project.id)}
              className="inline-flex h-8 items-center gap-1.5 rounded-ui border border-border bg-surface px-3 text-sm font-medium shadow-ui-sm hover:bg-surface-hover"
            >
              <UserPlus className="size-4" /> Invite
            </Link>
          )}
        </div>
      </div>
      <LinkTabs className="mt-4" items={projectViews(project.id, project.access.canManage)} />
      <div className="pt-5">{children}</div>
    </div>
  );
}

function FavoriteButton({ project }: { project: ProjectDetail }) {
  const toggle = useToggleFavorite();
  return (
    <button
      type="button"
      onClick={() => toggle.mutate({ id: project.id, favorite: !project.isFavorite })}
      disabled={toggle.isPending}
      aria-pressed={project.isFavorite}
      aria-label={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      title={project.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
      className="flex size-8 items-center justify-center rounded-ui text-muted hover:bg-surface-muted hover:text-foreground"
    >
      <Star className={cn('size-[18px]', project.isFavorite && 'fill-amber-400 text-amber-400')} />
    </button>
  );
}
