'use client';

import { Activity, AlertTriangle, ArrowRight, CalendarCheck, CheckCircle2, Clock, Flag, FolderKanban } from 'lucide-react';
import Link from 'next/link';
import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { useSession } from '@/features/auth/api';
import { useDashboard, type DashboardOverview } from '@/features/dashboard/api';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, contrastText, formatMinutes, formatShortDate, isOverdue } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';
import { CollapsibleCard, Disclosure } from '@/shared/ui/collapsible';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { ProgressBar } from '@/shared/ui/layout';

/** How many recent updates the Home feed shows. */
const UPDATES_SHOWN = 8;
/** Milestones listed before the rest fold behind "Show more". */
const MILESTONES_SHOWN = 3;

function greeting(date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

/** Landing page: a personal summary of projects, assigned work and recent updates. */
export function HomeView() {
  const { data: user } = useSession();
  const { data, isLoading, isError, error, refetch } = useDashboard();

  return (
    <div className="space-y-5">
      <div>
        {/* The greeting depends on the viewer's clock, which can differ from the server's. */}
        <h1 className="text-2xl font-semibold tracking-tight" suppressHydrationWarning>
          {greeting()}
          {user ? `, ${user.firstName}` : ''}!
        </h1>
        <p className="mt-1 text-sm text-muted">Pick up where you left off: your projects, your work and what changed.</p>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : (
        <>
          <QuickStats counts={data.counts} />
          <div className="grid gap-5 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
            <div className="min-w-0 space-y-5">
              <MyWorkPreview tasks={data.myTasks} />
              <RecentProjects projects={data.projects} />
            </div>
            <div className="min-w-0 space-y-5">
              <UpcomingMilestones milestones={data.upcomingMilestones} />
              <CollapsibleCard title="Updates" icon={<Activity />} storageKey="home.updates" bodyClassName="p-[var(--card-p)]">
                <ActivityFeed pageSize={UPDATES_SHOWN} paginated={false} />
              </CollapsibleCard>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-xs font-medium text-brand hover:underline">
      {label} <ArrowRight className="size-3.5" />
    </Link>
  );
}

/** One compact strip instead of four large tiles. */
function QuickStats({ counts }: { counts: DashboardOverview['counts'] }) {
  const stats = [
    { label: 'My open tasks', value: counts.myOpenTasks, icon: <CalendarCheck />, href: routes.myWork },
    { label: 'Overdue tasks', value: counts.overdueTasks, icon: <AlertTriangle />, tone: counts.overdueTasks ? 'text-danger bg-danger-soft' : undefined, danger: counts.overdueTasks > 0 },
    { label: 'Completed this week', value: counts.completedThisWeek, icon: <CheckCircle2 />, tone: 'text-success bg-success-soft' },
    { label: 'My time this week', value: formatMinutes(counts.minutesThisWeek), icon: <Clock />, href: routes.timesheets },
  ];
  return (
    <Card className="grid grid-cols-2 divide-border overflow-hidden lg:grid-cols-4 lg:divide-x [&>*:nth-child(-n+2)]:max-lg:border-b [&>*:nth-child(odd)]:max-lg:border-r">
      {stats.map((stat) => {
        const body = (
          <>
            <span className={cn('flex size-8 shrink-0 items-center justify-center rounded-ui [&_svg]:size-4', stat.tone ?? 'bg-brand-soft text-brand')}>{stat.icon}</span>
            <span className="min-w-0">
              <span className={cn('block text-lg font-semibold tabular-nums leading-tight', stat.danger && 'text-danger')}>{stat.value}</span>
              <span className="block truncate text-xs text-muted">{stat.label}</span>
            </span>
          </>
        );
        const className = 'flex items-center gap-3 border-border px-4 py-3';
        return stat.href ? (
          <Link key={stat.label} href={stat.href} className={cn(className, 'transition-colors hover:bg-surface-hover')}>
            {body}
          </Link>
        ) : (
          <div key={stat.label} className={className}>
            {body}
          </div>
        );
      })}
    </Card>
  );
}

function RecentProjects({ projects }: { projects: DashboardOverview['projects'] }) {
  return (
    <CollapsibleCard
      title="Recent projects"
      icon={<FolderKanban />}
      meta={projects.length || undefined}
      storageKey="home.projects"
      actions={<SeeAll href={routes.projects} label="All projects" />}
    >
      {projects.length ? (
        <ul className="divide-y divide-border">
          {projects.map((project) => {
            const color = project.color ?? 'var(--brand)';
            return (
              <li key={project.id}>
                <Link href={routes.project(project.id)} className="group flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                  <span
                    className="w-12 shrink-0 truncate rounded px-1.5 py-0.5 text-center font-mono text-[11px] font-semibold"
                    style={{ backgroundColor: color, color: project.color ? contrastText(project.color) : 'var(--brand-foreground)' }}
                  >
                    {project.key}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium group-hover:text-brand">{project.name}</span>
                    <span className="block truncate text-xs text-muted">{project.status.name}</span>
                  </span>
                  <span className="hidden w-32 shrink-0 sm:block">
                    <ProgressBar value={project.stats.progress} color={project.color ?? undefined} />
                  </span>
                  <span className="w-10 shrink-0 text-right text-xs tabular-nums text-muted">{project.stats.progress}%</span>
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <EmptyState icon={<FolderKanban className="size-6" />} title="No projects yet" description="Projects you are part of appear here." />
      )}
    </CollapsibleCard>
  );
}

function MyWorkPreview({ tasks }: { tasks: DashboardOverview['myTasks'] }) {
  return (
    <CollapsibleCard
      title="My work"
      icon={<CalendarCheck />}
      meta={tasks.length || undefined}
      storageKey="home.my-work"
      actions={<SeeAll href={routes.myWork} label="Open My work" />}
    >
      {tasks.length ? (
        <ul className="divide-y divide-border">
          {tasks.map((task) => (
            <li key={task.id}>
              <Link href={routes.projectTask(task.projectId, task.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: task.project.color ?? 'var(--brand)' }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">{task.title}</span>
                  <span className="block truncate text-xs text-muted">{task.project.name}</span>
                </span>
                <span
                  className="hidden w-28 shrink-0 truncate rounded px-2 py-1 text-center text-xs font-medium sm:block"
                  style={{ backgroundColor: task.status.color, color: contrastText(task.status.color) }}
                >
                  {task.status.name}
                </span>
                <span className={cn('w-16 shrink-0 text-right text-xs tabular-nums', isOverdue(task.dueDate) ? 'font-medium text-danger' : 'text-muted')}>
                  {formatShortDate(task.dueDate)}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <p className="flex items-center gap-2 px-4 py-4 text-sm text-muted">
          <CheckCircle2 className="size-4 text-success" /> You are all caught up. Nothing is assigned to you right now.
        </p>
      )}
    </CollapsibleCard>
  );
}

function MilestoneRow({ milestone }: { milestone: DashboardOverview['upcomingMilestones'][number] }) {
  return (
    <li>
      <Link href={routes.projectMilestones(milestone.project.id)} className="flex items-center gap-3 px-4 py-2.5 hover:bg-surface-hover">
        <Flag className="size-4 shrink-0" style={{ color: milestone.project.color ?? 'var(--brand)' }} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-medium">{milestone.name}</span>
          <span className="block truncate text-xs text-muted">{milestone.project.name}</span>
        </span>
        <span className={cn('shrink-0 text-xs tabular-nums', isOverdue(milestone.dueDate) ? 'font-medium text-danger' : 'text-muted')}>
          {formatShortDate(milestone.dueDate)}
        </span>
      </Link>
    </li>
  );
}

function UpcomingMilestones({ milestones }: { milestones: DashboardOverview['upcomingMilestones'] }) {
  if (!milestones.length) return null;
  const first = milestones.slice(0, MILESTONES_SHOWN);
  const rest = milestones.slice(MILESTONES_SHOWN);
  return (
    <CollapsibleCard title="Upcoming milestones" icon={<Flag />} meta={milestones.length} storageKey="home.milestones">
      <ul className="divide-y divide-border">
        {first.map((milestone) => (
          <MilestoneRow key={milestone.id} milestone={milestone} />
        ))}
      </ul>
      {rest.length > 0 && (
        <Disclosure label={`Show ${rest.length} more`} className="border-t border-border px-4 py-2.5 [&>div]:-mx-4 [&>div]:-mb-2.5 [&>div]:mt-2.5 [&>div]:border-t [&>div]:border-border">
          <ul className="divide-y divide-border">
            {rest.map((milestone) => (
              <MilestoneRow key={milestone.id} milestone={milestone} />
            ))}
          </ul>
        </Disclosure>
      )}
    </CollapsibleCard>
  );
}
