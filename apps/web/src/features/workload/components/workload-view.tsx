'use client';

import { ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSession } from '@/features/auth/api';
import { addDays, daysBetween, isWeekend, startOfWeekKey, taskKey, todayKey, type DateKey } from '@/features/calendar/calendar-dates';
import { useProjectMembers } from '@/features/projects/api';
import { useTasks } from '@/features/tasks/api';
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer';
import type { Task } from '@/features/tasks/types';
import { appConfig } from '@/shared/config/env';
import { StatusCategory } from '@/shared/constants/domain';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, fullName } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';

const WEEKS = 8;
const WORKDAYS_PER_WEEK = 5;
const UNASSIGNED = '__unassigned__';

interface Cell {
  hours: number;
  tasks: Map<string, Task>;
}

type Load = Map<string, Map<DateKey, Cell>>;

/**
 * Hours of open, estimated work per person per week. Each task's estimate is spread evenly
 * over the working days between its start and due date and split between its assignees.
 */
function computeLoad(tasks: Task[], weekStartsOn: number): Load {
  const load: Load = new Map();
  for (const task of tasks) {
    if (task.status.category === StatusCategory.CLOSED || !task.estimatedHours) continue;
    const end = taskKey(task.dueDate) ?? taskKey(task.startDate);
    const start = taskKey(task.startDate) ?? end;
    if (!start || !end) continue;
    const span = daysBetween(start, end);
    const workdays = span.filter((day) => !isWeekend(day));
    const days = workdays.length ? workdays : span;
    const people = task.assignees.length ? task.assignees.map((a) => a.id) : [UNASSIGNED];
    const perDay = task.estimatedHours / days.length / people.length;
    for (const person of people) {
      const weeks = load.get(person) ?? new Map<DateKey, Cell>();
      for (const day of days) {
        const week = startOfWeekKey(day, weekStartsOn);
        const cell = weeks.get(week) ?? { hours: 0, tasks: new Map() };
        cell.hours += perDay;
        cell.tasks.set(task.id, task);
        weeks.set(week, cell);
      }
      load.set(person, weeks);
    }
  }
  return load;
}

function tone(ratio: number): string {
  if (ratio > 1) return 'bg-danger';
  if (ratio >= 0.8) return 'bg-warning';
  return 'bg-success';
}

export function WorkloadView({ projectId }: { projectId: string }) {
  const { data: session } = useSession();
  const weekStartsOn = session?.organization?.weekStartsOn ?? 1;
  const capacity = (session?.organization?.workingHoursPerDay ?? 8) * WORKDAYS_PER_WEEK;
  const [offset, setOffset] = useState(0);
  const [selected, setSelected] = useState<{ person: string; week: DateKey } | null>(null);
  const [taskId, setTaskId] = useQueryParam('taskId');

  const { data: members } = useProjectMembers(projectId);
  const { data, isLoading, isError, error, refetch } = useTasks({ projectId, rootOnly: true, limit: appConfig.boardPageSize });
  const tasks = useMemo(() => data?.data ?? [], [data]);

  const firstWeek = addDays(startOfWeekKey(todayKey(), weekStartsOn), offset * 7);
  const weeks = Array.from({ length: WEEKS }, (_, i) => addDays(firstWeek, i * 7));
  const load = useMemo(() => computeLoad(tasks, weekStartsOn), [tasks, weekStartsOn]);

  const people = useMemo(() => {
    const rows: { id: string; user: UserSummary | null }[] = (members ?? []).filter((m) => m.user.isActive).map((m) => ({ id: m.userId, user: m.user }));
    // Assignees who are no longer project members still carry load.
    for (const task of tasks) for (const a of task.assignees) if (!rows.some((r) => r.id === a.id)) rows.push({ id: a.id, user: a });
    if (load.has(UNASSIGNED)) rows.push({ id: UNASSIGNED, user: null });
    return rows;
  }, [members, tasks, load]);

  const unestimated = tasks.filter((t) => t.status.category !== StatusCategory.CLOSED && !t.estimatedHours).length;
  const selectedTasks = selected ? [...(load.get(selected.person)?.get(selected.week)?.tasks.values() ?? [])] : [];

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  return (
    <div className="space-y-4">
      <Card className="overflow-hidden">
        <CardHeader
          title="Workload"
          description={`Estimated hours per week against a capacity of ${capacity}h (${WORKDAYS_PER_WEEK} days × ${capacity / WORKDAYS_PER_WEEK}h).`}
          actions={
            <div className="flex items-center gap-1.5">
              <Button variant="secondary" size="icon" aria-label="Earlier weeks" onClick={() => setOffset(offset - WEEKS / 2)}>
                <ChevronLeft />
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setOffset(0)}>
                This week
              </Button>
              <Button variant="secondary" size="icon" aria-label="Later weeks" onClick={() => setOffset(offset + WEEKS / 2)}>
                <ChevronRight />
              </Button>
            </div>
          }
        />
        {people.length === 0 ? (
          <EmptyState title="No team members yet" description="Add members to the project to see their workload." />
        ) : (
          <div className="scrollbar-thin overflow-x-auto">
            <table className="w-full min-w-[860px] border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted/50">
                  <th className="sticky left-0 z-[1] w-56 bg-surface px-4 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted">Person</th>
                  {weeks.map((week) => (
                    <th key={week} className="px-2 py-2.5 text-left text-xs font-semibold text-muted">
                      {new Date(`${week}T00:00:00Z`).toLocaleDateString(undefined, { month: 'short', day: 'numeric', timeZone: 'UTC' })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {people.map(({ id, user }) => (
                  <tr key={id} className="border-t border-border">
                    <td className="sticky left-0 z-[1] bg-surface px-4 py-2.5">
                      {user ? (
                        <div className="flex items-center gap-2.5">
                          <Avatar user={user} size="sm" />
                          <span className="truncate font-medium">{fullName(user)}</span>
                        </div>
                      ) : (
                        <span className="font-medium text-muted">Unassigned</span>
                      )}
                    </td>
                    {weeks.map((week) => {
                      const hours = load.get(id)?.get(week)?.hours ?? 0;
                      const ratio = hours / capacity;
                      const active = selected?.person === id && selected.week === week;
                      return (
                        <td key={week} className="px-1.5 py-1.5">
                          <button
                            type="button"
                            disabled={!hours}
                            onClick={() => setSelected(active ? null : { person: id, week })}
                            className={cn(
                              'flex h-12 w-full flex-col justify-between rounded-ui border px-2 py-1.5 text-left transition-colors',
                              hours ? 'border-border bg-surface hover:border-border-strong' : 'border-dashed border-border/70 bg-transparent',
                              active && 'border-brand ring-2 ring-brand/20',
                            )}
                            title={hours ? `${hours.toFixed(1)}h of ${capacity}h` : 'Free'}
                          >
                            <span className={cn('text-xs font-semibold tabular-nums', ratio > 1 && 'text-danger')}>{hours ? `${Math.round(hours)}h` : ''}</span>
                            {hours > 0 && (
                              <span className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
                                <span className={cn('block h-full rounded-full', tone(ratio))} style={{ width: `${Math.min(100, ratio * 100)}%` }} />
                              </span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="flex flex-wrap items-center gap-4 border-t border-border px-4 py-3 text-xs text-muted">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-success" /> Under 80%</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-warning" /> 80–100%</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-full bg-danger" /> Over capacity</span>
          {unestimated > 0 && (
            <span className="flex items-center gap-1.5"><Info className="size-3.5" /> {unestimated} open item{unestimated === 1 ? '' : 's'} without an estimate are not counted</span>
          )}
        </div>
      </Card>

      {selected && selectedTasks.length > 0 && (
        <Card>
          <CardHeader title="Items in this week" description="Click an item to open it." />
          <ul className="divide-y divide-border">
            {selectedTasks.map((task) => (
              <li key={task.id}>
                <button type="button" onClick={() => setTaskId(task.id)} className="flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm hover:bg-surface-hover">
                  <span className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: task.status.color }} />
                  <span className="min-w-0 flex-1 truncate font-medium">{task.title}</span>
                  <span className="text-xs text-muted">{task.estimatedHours}h total</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      <TaskDetailDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenTask={setTaskId} />
    </div>
  );
}
