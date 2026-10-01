'use client';

import { AlertTriangle, CheckCircle2, Clock, Flag, ListTodo } from 'lucide-react';
import { ActivityFeed } from '@/features/activity/components/activity-feed';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, formatMinutes, fullName, minutesToHours } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { BarList, DonutChart } from '@/shared/ui/charts';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { ProgressBar, StatCard } from '@/shared/ui/layout';
import { useProject, useProjectDashboard } from '../api';

export function ProjectOverview({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data, isLoading, isError, error, refetch } = useProjectDashboard(projectId);

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const budgetMinutes = (data.project.budgetHours ?? 0) * 60;
  const budgetUsed = budgetMinutes ? Math.round((data.loggedMinutes / budgetMinutes) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard label="Open tasks" value={data.stats.openTasks} icon={<ListTodo className="size-5" />} hint={`${data.stats.totalTasks} total`} />
        <StatCard label="Completed" value={data.stats.completedTasks} icon={<CheckCircle2 className="size-5" />} tone="success" hint={`${data.stats.progress}% done`} />
        <StatCard label="Overdue" value={data.stats.overdueTasks} icon={<AlertTriangle className="size-5" />} tone="danger" />
        <StatCard
          label="Time logged"
          value={formatMinutes(data.loggedMinutes)}
          icon={<Clock className="size-5" />}
          tone="warning"
          hint={`${formatMinutes(data.billableMinutes)} billable`}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Tasks by status" />
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

      <div className="grid gap-6 xl:grid-cols-3">
        <Card>
          <CardHeader title="Milestones" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-3 gap-2 text-center">
              <Metric label="Total" value={data.milestones.total} />
              <Metric label="Done" value={data.milestones.completed} />
              <Metric label="Overdue" value={data.milestones.overdue} danger={data.milestones.overdue > 0} />
            </div>
            {data.milestones.next ? (
              <div className="flex items-center gap-3 rounded-ui bg-surface-muted p-3 text-sm">
                <Flag className="size-4 text-brand" />
                <div>
                  <p className="font-medium">{data.milestones.next.name}</p>
                  <p className="text-xs text-muted">Next milestone · due {formatDate(data.milestones.next.dueDate)}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted">No upcoming milestones.</p>
            )}
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Budget" description={data.project.budgetHours ? `${data.project.budgetHours}h budgeted` : 'No budget set'} />
          <CardBody className="space-y-4">
            <div>
              <div className="mb-1.5 flex justify-between text-sm">
                <span className="text-muted">Logged</span>
                <span className="font-medium">
                  {minutesToHours(data.loggedMinutes)}h {budgetMinutes ? `(${budgetUsed}%)` : ''}
                </span>
              </div>
              <ProgressBar value={budgetUsed} color={budgetUsed > 100 ? 'var(--danger)' : budgetUsed > 90 ? 'var(--warning)' : undefined} />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Estimated effort</span>
              <span className="font-medium">{data.estimatedHours}h</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Owner</span>
              {project && (
                <span className="flex items-center gap-2 font-medium">
                  <Avatar user={project.owner} size="xs" /> {fullName(project.owner)}
                </span>
              )}
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Open issues by severity" />
          <CardBody>
            <BarList data={data.issuesBySeverity} emptyLabel="No open issues" />
          </CardBody>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Team workload" description="Open tasks per member" />
          <CardBody className="space-y-3">
            {data.workload.map((row) => {
              const max = Math.max(...data.workload.map((w) => w.openTasks), 1);
              return (
                <div key={row.user.id} className="flex items-center gap-3">
                  <Avatar user={row.user} />
                  <div className="min-w-0 flex-1">
                    <div className="mb-1 flex justify-between text-sm">
                      <span className="truncate font-medium">{fullName(row.user)}</span>
                      <span className="text-xs text-muted">
                        {row.openTasks} open{row.overdueTasks ? <span className="text-danger"> · {row.overdueTasks} overdue</span> : null}
                      </span>
                    </div>
                    <ProgressBar value={(row.openTasks / max) * 100} />
                  </div>
                </div>
              );
            })}
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Recent activity" />
          <CardBody>
            <ActivityFeed projectId={projectId} pageSize={6} paginated={false} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function Metric({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <div className="rounded-ui bg-surface-muted py-2">
      <p className={`text-xl font-semibold ${danger ? 'text-danger' : ''}`}>{value}</p>
      <p className="text-xs text-muted">{label}</p>
    </div>
  );
}
