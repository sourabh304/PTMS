'use client';

import { CalendarX2, ChevronLeft, ChevronRight, GripVertical } from 'lucide-react';
import { useMemo, useState, type DragEvent } from 'react';
import { useSession } from '@/features/auth/api';
import { useQuickUpdateTask, useTasks } from '@/features/tasks/api';
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer';
import type { Task, TaskQuery } from '@/features/tasks/types';
import { appConfig } from '@/shared/config/env';
import { StatusCategory } from '@/shared/constants/domain';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { cn } from '@/shared/lib/utils';
import { AvatarGroup } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { Modal } from '@/shared/ui/modal';
import {
  addDays,
  daysBetween,
  diffDays,
  monthGrid,
  monthLabel,
  shiftMonth,
  taskKey,
  todayKey,
  weekdayLabels,
  type DateKey,
} from '../calendar-dates';

interface TaskCalendarProps {
  /** Which tasks to show (e.g. one project, or `mine`). */
  query: TaskQuery;
  canEdit: boolean;
  /** Show the project key on each item (cross-project calendars). */
  showProject?: boolean;
}

const MAX_PER_DAY = 3;
const DRAG_TYPE = 'application/x-task-id';

/** Month calendar of tasks spanning their start → due dates; drag to reschedule. */
export function TaskCalendar({ query, canEdit, showProject }: TaskCalendarProps) {
  const { data: session } = useSession();
  const weekStartsOn = session?.organization?.weekStartsOn ?? 1;
  const [month, setMonth] = useState<DateKey>(todayKey());
  const [taskId, setTaskId] = useQueryParam('taskId');
  const [expandedDay, setExpandedDay] = useState<DateKey | null>(null);
  const [dropTarget, setDropTarget] = useState<DateKey | null>(null);
  const update = useQuickUpdateTask();
  const today = todayKey();

  const { data, isLoading, isError, error, refetch } = useTasks({ ...query, limit: appConfig.boardPageSize, sortBy: 'dueDate', sortOrder: 'asc' });
  const tasks = useMemo(() => data?.data ?? [], [data]);
  const days = useMemo(() => monthGrid(month, weekStartsOn), [month, weekStartsOn]);

  const { byDay, unscheduled } = useMemo(() => {
    const map = new Map<DateKey, Task[]>();
    const loose: Task[] = [];
    const visible = new Set(days);
    for (const task of tasks) {
      const start = taskKey(task.startDate) ?? taskKey(task.dueDate);
      const end = taskKey(task.dueDate) ?? start;
      if (!start || !end) {
        loose.push(task);
        continue;
      }
      for (const day of daysBetween(start, end)) {
        if (!visible.has(day)) continue;
        map.set(day, [...(map.get(day) ?? []), task]);
      }
    }
    return { byDay: map, unscheduled: loose };
  }, [tasks, days]);

  /** Moves the task so it ends on `day`, keeping its duration. */
  const reschedule = (task: Task, day: DateKey) => {
    const due = taskKey(task.dueDate);
    const start = taskKey(task.startDate);
    const anchor = due ?? start;
    const delta = anchor ? diffDays(anchor, day) : 0;
    if (anchor && delta === 0) return;
    const nextDue = anchor ? addDays(due ?? anchor, delta) : day;
    const nextStart = start ? addDays(start, delta) : null;
    const input = { dueDate: nextDue, ...(start ? { startDate: nextStart } : {}) };
    update.mutate({
      id: task.id,
      input,
      preview: { dueDate: `${nextDue}T00:00:00.000Z`, ...(nextStart ? { startDate: `${nextStart}T00:00:00.000Z` } : {}) },
    });
  };

  const onDrop = (event: DragEvent, day: DateKey) => {
    event.preventDefault();
    setDropTarget(null);
    const id = event.dataTransfer.getData(DRAG_TYPE);
    const task = tasks.find((t) => t.id === id);
    if (task) reschedule(task, day);
  };

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const itemProps = (task: Task) => ({
    task,
    showProject,
    draggable: canEdit,
    onOpen: () => setTaskId(task.id),
  });

  return (
    <div className="flex flex-col gap-4 xl:flex-row">
      <Card className="min-w-0 flex-1 overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" aria-label="Previous month" onClick={() => setMonth(shiftMonth(month, -1))}>
              <ChevronLeft />
            </Button>
            <Button variant="secondary" size="icon" aria-label="Next month" onClick={() => setMonth(shiftMonth(month, 1))}>
              <ChevronRight />
            </Button>
            <h2 className="ml-1 text-base font-semibold">{monthLabel(month)}</h2>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setMonth(today)}>
            Today
          </Button>
        </div>
        <div className="scrollbar-thin overflow-x-auto">
          <div className="min-w-[720px]">
            <div className="grid grid-cols-7 border-b border-border bg-surface-muted/50">
              {weekdayLabels(weekStartsOn).map((label) => (
                <div key={label} className="px-2 py-2 text-xs font-semibold uppercase tracking-wide text-muted">
                  {label}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7">
              {days.map((day) => {
                const items = byDay.get(day) ?? [];
                const inMonth = day.slice(0, 7) === month.slice(0, 7);
                return (
                  <div
                    key={day}
                    onDragOver={(event) => {
                      if (!canEdit) return;
                      event.preventDefault();
                      setDropTarget(day);
                    }}
                    onDragLeave={() => setDropTarget((current) => (current === day ? null : current))}
                    onDrop={(event) => onDrop(event, day)}
                    className={cn(
                      'min-h-28 border-b border-r border-border p-1.5 transition-colors [&:nth-child(7n)]:border-r-0',
                      !inMonth && 'bg-surface-muted/40',
                      dropTarget === day && 'bg-brand-soft',
                    )}
                  >
                    <div className="mb-1 flex justify-end">
                      <span
                        className={cn(
                          'flex size-6 items-center justify-center rounded-full text-xs font-medium',
                          day === today ? 'bg-brand text-brand-foreground' : inMonth ? 'text-foreground' : 'text-muted',
                        )}
                      >
                        {Number(day.slice(8))}
                      </span>
                    </div>
                    <div className="space-y-1">
                      {items.slice(0, MAX_PER_DAY).map((task) => (
                        <CalendarItem key={task.id} {...itemProps(task)} />
                      ))}
                      {items.length > MAX_PER_DAY && (
                        <button type="button" onClick={() => setExpandedDay(day)} className="w-full rounded px-1.5 text-left text-xs font-medium text-muted hover:text-foreground">
                          +{items.length - MAX_PER_DAY} more
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card className="w-full shrink-0 xl:w-72">
        <div className="border-b border-border px-4 py-3">
          <h3 className="text-sm font-semibold">Unscheduled</h3>
          <p className="text-xs text-muted">{canEdit ? 'Drag an item onto a day to schedule it.' : 'Items without dates.'}</p>
        </div>
        <div className="scrollbar-thin max-h-[560px] space-y-1.5 overflow-y-auto p-3">
          {unscheduled.length ? (
            unscheduled.map((task) => <CalendarItem key={task.id} {...itemProps(task)} roomy />)
          ) : (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-xs text-muted">
              <CalendarX2 className="size-5" />
              Everything has a date.
            </div>
          )}
        </div>
      </Card>

      <Modal open={!!expandedDay} onClose={() => setExpandedDay(null)} title={expandedDay ? new Date(`${expandedDay}T00:00:00Z`).toLocaleDateString(undefined, { dateStyle: 'full', timeZone: 'UTC' }) : ''} size="sm">
        <div className="space-y-1.5">
          {(expandedDay ? (byDay.get(expandedDay) ?? []) : []).map((task) => (
            <CalendarItem key={task.id} {...itemProps(task)} draggable={false} roomy />
          ))}
        </div>
      </Modal>

      <TaskDetailDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenTask={setTaskId} />
    </div>
  );
}

interface CalendarItemProps {
  task: Task;
  showProject?: boolean;
  draggable: boolean;
  roomy?: boolean;
  onOpen: () => void;
}

function CalendarItem({ task, showProject, draggable, roomy, onOpen }: CalendarItemProps) {
  const done = task.status.category === StatusCategory.CLOSED;
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={draggable}
      onDragStart={(event) => {
        event.dataTransfer.setData(DRAG_TYPE, task.id);
        event.dataTransfer.effectAllowed = 'move';
      }}
      onClick={onOpen}
      onKeyDown={(event) => event.key === 'Enter' && onOpen()}
      title={`${task.project.key}-${task.number} ${task.title} · ${task.status.name}`}
      className={cn(
        'group flex w-full cursor-pointer items-center gap-1.5 overflow-hidden rounded-md border-l-[3px] bg-surface text-left text-xs shadow-ui-sm transition hover:brightness-[0.98]',
        roomy ? 'px-2 py-1.5' : 'px-1.5 py-1',
        done && 'opacity-60',
      )}
      style={{ borderLeftColor: task.status.color }}
    >
      {draggable && <GripVertical className="size-3 shrink-0 text-muted opacity-0 group-hover:opacity-100" />}
      <span className={cn('min-w-0 flex-1 truncate font-medium', done && 'line-through')}>
        {showProject && <span className="mr-1 text-muted">{task.project.key}</span>}
        {task.title}
      </span>
      {roomy && task.assignees.length > 0 && <AvatarGroup users={task.assignees} max={2} size="xs" />}
    </div>
  );
}
