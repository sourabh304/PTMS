'use client';

import { Bug, CheckSquare } from 'lucide-react';
import { useState } from 'react';
import { useIssues } from '@/features/issues/api';
import { IssueDrawer } from '@/features/issues/components/issue-drawer';
import { IssueTable } from '@/features/issues/components/issue-table';
import { useTasks } from '@/features/tasks/api';
import { TaskDetailDrawer } from '@/features/tasks/components/task-detail-drawer';
import { TaskTable } from '@/features/tasks/components/task-table';
import { appConfig } from '@/shared/config/env';
import { StatusCategory } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Checkbox, Input } from '@/shared/ui/form';
import { PageHeader, Pagination, Segmented } from '@/shared/ui/layout';

type Tab = 'tasks' | 'issues';
type Scope = 'open' | 'closed';

export function MyWorkView() {
  const [tab, setTab] = useState<Tab>('tasks');
  const [scope, setScope] = useState<Scope>('open');
  const [overdue, setOverdue] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  const [taskId, setTaskId] = useQueryParam('taskId');
  const [issueId, setIssueId] = useQueryParam('issueId');

  const common = { mine: true, search: debounced || undefined, page, limit: appConfig.defaultPageSize };
  const tasks = useTasks(
    {
      ...common,
      ...(scope === 'closed' ? { statusCategory: StatusCategory.CLOSED } : {}),
      overdue: overdue || undefined,
      sortBy: scope === 'open' ? 'dueDate' : 'updatedAt',
    },
    tab === 'tasks',
  );
  const issues = useIssues({ ...common, ...(scope === 'closed' ? { statusCategory: StatusCategory.CLOSED } : {}) });
  const active = tab === 'tasks' ? tasks : issues;

  // Open scope = anything not closed; filter client-side because the API filters by a single category.
  const taskRows = (tasks.data?.data ?? []).filter((t) => scope === 'closed' || t.status.category !== StatusCategory.CLOSED);
  const issueRows = (issues.data?.data ?? []).filter((i) => scope === 'closed' || i.status.category !== StatusCategory.CLOSED);

  const reset = () => setPage(1);

  return (
    <>
      <PageHeader title="My work" description="Everything assigned to you across all projects." />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Segmented<Tab>
          value={tab}
          onChange={(value) => {
            setTab(value);
            reset();
          }}
          options={[
            { value: 'tasks', label: 'Tasks' },
            { value: 'issues', label: 'Issues' },
          ]}
        />
        <Segmented<Scope>
          value={scope}
          onChange={(value) => {
            setScope(value);
            reset();
          }}
          options={[
            { value: 'open', label: 'Open' },
            { value: 'closed', label: 'Completed' },
          ]}
        />
        <Input className="max-w-xs" placeholder="Search" value={search} onChange={(e) => setSearch(e.target.value)} />
        {tab === 'tasks' && scope === 'open' && <Checkbox id="my-overdue" label="Overdue only" checked={overdue} onChange={(e) => setOverdue(e.target.checked)} />}
      </div>

      <Card>
        {active.isLoading ? (
          <Spinner />
        ) : active.isError ? (
          <ErrorState message={errorMessage(active.error)} onRetry={active.refetch} />
        ) : tab === 'tasks' ? (
          taskRows.length ? (
            <TaskTable tasks={taskRows} onOpen={(t) => setTaskId(t.id)} showProject />
          ) : (
            <EmptyState icon={<CheckSquare className="h-6 w-6" />} title="No tasks here" description="Tasks assigned to you will show up here." />
          )
        ) : issueRows.length ? (
          <IssueTable issues={issueRows} onOpen={(i) => setIssueId(i.id)} showProject />
        ) : (
          <EmptyState icon={<Bug className="h-6 w-6" />} title="No issues here" description="Issues assigned to you will show up here." />
        )}
        {active.data && <Pagination page={active.data.meta.page} totalPages={active.data.meta.totalPages} total={active.data.meta.total} onPageChange={setPage} />}
      </Card>

      <TaskDetailDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenTask={setTaskId} />
      <IssueDrawer issueId={issueId} onClose={() => setIssueId(null)} />
    </>
  );
}
