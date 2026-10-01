'use client';

import { AlertTriangle, Bug, CheckCircle2, Clock, Flag, FolderKanban, ListTodo, UserCheck } from 'lucide-react';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { useSession } from '@/features/auth/api';
import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatDate, formatMinutes, isOverdue } from '@/shared/lib/utils';
import { ColorBadge } from '@/shared/ui/badge';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { BarList, DonutChart } from '@/shared/ui/charts';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { PageHeader, ProgressBar, StatCard } from '@/shared/ui/layout';
import { useDashboard } from '../api';

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardView() {
  const { data: user } = useSession();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  const { counts } = data;

  return (
    <>
      <PageHeader title={`${greeting()}, ${user?.firstName ?? ''}`} description="Here is what is happening across your projects." />

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Active projects" value={counts.activeProjects} icon={<FolderKanban />} hint={`${data.upcomingMilestones.length} upcoming milestones`} />
        <StatCard label="Open tasks" value={counts.openTasks} icon={<ListTodo />} hint={`${counts.myOpenTasks} assigned to you`} />
        <StatCard label="Overdue tasks" value={counts.overdueTasks} icon={<AlertTriangle />} tone="danger" hint="Past due and not completed" />
        <StatCard label="Open issues" value={counts.openIssues} icon={<Bug />} tone="warning" hint={`${counts.myOpenIssues} assigned to you`} />
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <WeekMetric icon={<CheckCircle2 />} label="Tasks completed this week" value={counts.completedThisWeek} />
        <WeekMetric icon={<Clock />} label="Your time logged this week" value={formatMinutes(counts.minutesThisWeek)} />
        <WeekMetric icon={<UserCheck />} label="Your open tasks" value={counts.myOpenTasks} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Tasks by status" description="Across all visible projects" />
          <CardBody>
            <DonutChart data={data.tasksByStatus} emptyLabel="No tasks yet" />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Open tasks by priority" />
          <CardBody>
            <BarList data={data.tasksByPriority} emptyLabel="No open tasks" />
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Project health"
            actions={
              <Link href={routes.projects} className="text-xs font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {data.projects.length === 0 && <EmptyState title="No projects yet" />}
            {data.projects.map((project) => (
              <Link key={project.id} href={routes.project(project.id)} className="flex items-center gap-4 px-5 py-3 hover:bg-surface-muted/60">
                <span className="h-8 w-1 rounded-full" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{project.name}</p>
                  <p className="text-xs text-muted">
                    {project.stats.completedTasks}/{project.stats.totalTasks} tasks · due {formatDate(project.endDate)}
                    {project.stats.overdueTasks > 0 && <span className="text-danger"> · {project.stats.overdueTasks} overdue</span>}
                  </p>
                </div>
                <ColorBadge color={project.status.color} label={project.status.name} />
                <div className="hidden w-40 items-center gap-2 sm:flex">
                  <ProgressBar value={project.stats.progress} color={project.color ?? undefined} />
                  <span className="w-9 text-right text-xs font-semibold">{project.stats.progress}%</span>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        <Card>
          <CardHeader title="Upcoming milestones" />
          <CardBody className="space-y-3">
            {data.upcomingMilestones.length === 0 && <p className="text-sm text-muted">No upcoming milestones.</p>}
            {data.upcomingMilestones.map((milestone) => (
              <Link key={milestone.id} href={routes.projectMilestones(milestone.project.id)} className="flex items-start gap-3 rounded-ui p-2 hover:bg-surface-muted">
                <Flag className="mt-0.5 size-4 shrink-0" style={{ color: milestone.project.color ?? 'var(--brand)' }} />
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{milestone.name}</p>
                  <p className="text-xs text-muted">
                    {milestone.project.name} · {formatDate(milestone.dueDate)}
                  </p>
                </div>
              </Link>
            ))}
          </CardBody>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader
            title="My tasks due soon"
            actions={
              <Link href={routes.myWork} className="text-xs font-medium text-brand hover:underline">
                My work
              </Link>
            }
          />
          <div className="divide-y divide-border">
            {data.myTasks.length === 0 && <EmptyState title="Nothing due soon" description="Enjoy the calm — or pick up something new." />}
            {data.myTasks.map((task) => (
              <Link key={task.id} href={`${routes.projectTasks(task.projectId)}?taskId=${task.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-surface-muted/60">
                <span className="w-20 shrink-0 text-xs font-medium text-muted">
                  {task.project.key}-{task.number}
                </span>
                <span className="min-w-0 flex-1 truncate text-sm">{task.title}</span>
                <ColorBadge color={task.priority.color} label={task.priority.name} variant="dot" />
                <ColorBadge color={task.status.color} label={task.status.name} />
                <span className={cn('w-24 text-right text-xs', isOverdue(task.dueDate) ? 'font-medium text-danger' : 'text-muted')}>{formatDate(task.dueDate)}</span>
              </Link>
            ))}
          </div>
        </Card>
        <Card>
          <CardHeader title="Recent activity" />
          <CardBody>
            <ActivityFeed pageSize={8} paginated={false} />
          </CardBody>
        </Card>
      </div>
    </>
  );
}

function WeekMetric({ icon, label, value }: { icon: ReactNode; label: string; value: ReactNode }) {
  return (
    <div className="flex items-center gap-3 rounded-ui-lg border border-border bg-surface px-4 py-3 shadow-ui-sm">
      <span className="text-muted [&_svg]:size-4">{icon}</span>
      <span className="min-w-0 flex-1 truncate text-sm text-muted">{label}</span>
      <span className="text-sm font-semibold tabular-nums text-foreground">{value}</span>
    </div>
  );
}
