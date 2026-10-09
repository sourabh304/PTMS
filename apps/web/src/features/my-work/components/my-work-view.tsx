'use client';

import { Bug, CalendarCheck, ChevronDown, Search } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useSession } from '@/features/auth/api';
import { useIssues } from '@/features/issues/api';
import { IssueDrawer } from '@/features/issues/components/issue-drawer';
import { IssueTable } from '@/features/issues/components/issue-table';
import { useLookups } from '@/features/lookups/api';
import { useQuickUpdateTask, useTasks } from '@/features/tasks/api';
import { LookupCell } from '@/features/tasks/components/table/lookup-cell';
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer';
import type { Task } from '@/features/tasks/types';
import { appConfig } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { LookupType, StatusCategory } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatShortDate, isOverdue } from '@/shared/lib/utils';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Checkbox } from '@/shared/ui/form';
import { PageHeader, Pagination, Segmented } from '@/shared/ui/layout';
import { TaskCalendar } from '@/features/calendar/components/task-calendar';
import { bucketFor, DATE_BUCKETS, type DateBucketId } from '../my-work.buckets';

type Tab = 'tasks' | 'calendar' | 'issues';

export function MyWorkView() {
  const [tab, setTab] = useState<Tab>('tasks');
  const [search, setSearch] = useState('');
  const [showDone, setShowDone] = useState(false);
  const debounced = useDebounce(search);
  const [taskId, setTaskId] = useQueryParam('taskId');
  const [issueId, setIssueId] = useQueryParam('issueId');

  return (
    <>
      <PageHeader title="My work" description="Everything assigned to you across all projects, organized by date." />
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'tasks', label: 'Tasks' },
            { value: 'calendar', label: 'Calendar' },
            { value: 'issues', label: 'Issues' },
          ]}
        />
        <label className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search"
            aria-label="Search my work"
            className="h-[var(--control-h)] w-56 rounded-ui border border-border bg-surface pl-8 pr-2 text-sm focus:border-brand focus:outline-none"
          />
        </label>
        <Checkbox id="my-work-done" label="Show completed" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} />
      </div>

      {tab === 'tasks' && <TasksByDate search={debounced} showDone={showDone} onOpen={(task) => setTaskId(task.id)} />}
      {tab === 'calendar' && <TaskCalendar query={{ mine: true, search: debounced || undefined }} canEdit showProject meetings={{}} storageKey="calendar.mine" />}
      {tab === 'issues' && <MyIssues search={debounced} showDone={showDone} onOpen={setIssueId} />}

      {/* The calendar renders its own task drawer. */}
      {tab !== 'calendar' && <TaskDetailDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenTask={setTaskId} />}
      <IssueDrawer issueId={issueId} onClose={() => setIssueId(null)} />
    </>
  );
}

function TasksByDate({ search, showDone, onOpen }: { search: string; showDone: boolean; onOpen: (task: Task) => void }) {
  const { data: user } = useSession();
  const { data: statuses } = useLookups(LookupType.TASK_STATUS);
  const quickUpdate = useQuickUpdateTask();
  const [collapsed, setCollapsed] = useState<Set<DateBucketId>>(new Set());
  const { data, isLoading, isError, error, refetch } = useTasks({ mine: true, search: search || undefined, limit: appConfig.boardPageSize, sortBy: 'dueDate' });

  const buckets = useMemo(() => {
    const weekStartsOn = user?.organization?.weekStartsOn ?? 1;
    const tasks = (data?.data ?? []).filter((task) => showDone || task.status.category !== StatusCategory.CLOSED);
    return DATE_BUCKETS.map((bucket) => ({ ...bucket, tasks: tasks.filter((task) => bucketFor(task.dueDate, weekStartsOn) === bucket.id) })).filter(
      (bucket) => bucket.tasks.length,
    );
  }, [data, showDone, user]);

  const toggle = (id: DateBucketId) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  if (!buckets.length) {
    return (
      <Card>
        <EmptyState icon={<CalendarCheck className="size-6" />} title="Nothing on your plate" description={search ? 'No tasks match your search.' : 'Tasks assigned to you will show up here.'} />
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {buckets.map((bucket) => (
        <section key={bucket.id} aria-label={bucket.label}>
          <button type="button" onClick={() => toggle(bucket.id)} aria-expanded={!collapsed.has(bucket.id)} className="mb-2 flex items-center gap-1.5">
            <ChevronDown className={cn('size-[18px] transition-transform', collapsed.has(bucket.id) && '-rotate-90')} style={{ color: bucket.color }} />
            <span className="text-base font-semibold" style={{ color: bucket.color }}>
              {bucket.label}
            </span>
            <span className="text-xs text-muted">
              {bucket.tasks.length} {bucket.tasks.length === 1 ? 'task' : 'tasks'}
            </span>
          </button>
          {!collapsed.has(bucket.id) && (
            <div className="scrollbar-thin overflow-x-auto rounded-ui border border-border bg-surface">
              <div className="min-w-[640px]">
                <div className="grid grid-cols-[minmax(0,1fr)_200px_150px_110px] border-b border-border text-xs font-medium text-muted" style={{ boxShadow: `inset 6px 0 0 ${bucket.color}` }}>
                  <span className="py-2 pl-5">Task</span>
                  <span className="border-l border-border py-2 text-center">Project</span>
                  <span className="border-l border-border py-2 text-center">Status</span>
                  <span className="border-l border-border py-2 text-center">Date</span>
                </div>
                {bucket.tasks.map((task) => (
                  <div
                    key={task.id}
                    className="grid h-10 grid-cols-[minmax(0,1fr)_200px_150px_110px] border-b border-border text-sm last:border-b-0 hover:bg-surface-hover"
                    style={{ boxShadow: `inset 6px 0 0 ${bucket.color}` }}
                  >
                    <button type="button" onClick={() => onOpen(task)} className="truncate pl-5 pr-3 text-left font-medium hover:text-brand">
                      {task.title}
                    </button>
                    <Link href={routes.project(task.projectId)} className="flex min-w-0 items-center gap-2 border-l border-border px-3 text-xs text-foreground-soft hover:text-brand">
                      <span className="size-2 shrink-0 rounded-sm" style={{ backgroundColor: task.project.color ?? 'var(--brand)' }} />
                      <span className="truncate">{task.project.name}</span>
                    </Link>
                    <div className="border-l border-surface">
                      <LookupCell label="Status" value={task.status} options={statuses} onChange={(status) => quickUpdate.mutate({ id: task.id, input: { statusId: status.id }, preview: { statusId: status.id, status } })} />
                    </div>
                    <span
                      className={cn(
                        'flex items-center justify-center border-l border-border text-xs tabular-nums',
                        isOverdue(task.dueDate, task.status.category === StatusCategory.CLOSED) ? 'font-medium text-danger' : 'text-muted',
                      )}
                    >
                      {formatShortDate(task.dueDate)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>
      ))}
    </div>
  );
}

function MyIssues({ search, showDone, onOpen }: { search: string; showDone: boolean; onOpen: (id: string) => void }) {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, error, refetch } = useIssues({ mine: true, search: search || undefined, page, limit: appConfig.defaultPageSize });
  const issues = (data?.data ?? []).filter((issue) => showDone || issue.status.category !== StatusCategory.CLOSED);

  return (
    <Card>
      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : issues.length ? (
        <IssueTable issues={issues} onOpen={(issue) => onOpen(issue.id)} showProject />
      ) : (
        <EmptyState icon={<Bug className="size-6" />} title="No issues assigned to you" />
      )}
      {data && <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />}
    </Card>
  );
}
