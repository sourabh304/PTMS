'use client';

import { format, subDays } from 'date-fns';
import { Download } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useProjects } from '@/features/projects/api';
import { useTimeSummary } from '@/features/timesheets/api';
import { appConfig } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { ProjectHealth } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatDate, formatMinutes, fullName, humanize, minutesToHours } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge, ColorBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { BarList, ColumnChart, DonutChart } from '@/shared/ui/charts';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { Input, Select } from '@/shared/ui/form';
import { PageHeader, ProgressBar, Segmented } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useIssueReport, usePortfolioReport, useWorkloadReport, type PortfolioRow, type ReportRange } from '../api';

type Tab = 'portfolio' | 'workload' | 'time' | 'issues';

/** Default reporting window in days. */
const DEFAULT_RANGE_DAYS = 30;

const HEALTH_TONE = {
  [ProjectHealth.ON_TRACK]: 'success',
  [ProjectHealth.AT_RISK]: 'warning',
  [ProjectHealth.OFF_TRACK]: 'danger',
  [ProjectHealth.COMPLETED]: 'brand',
} as const;

export function ReportsView() {
  const [tab, setTab] = useState<Tab>('portfolio');
  const [range, setRange] = useState({
    from: format(subDays(new Date(), DEFAULT_RANGE_DAYS), 'yyyy-MM-dd'),
    to: format(new Date(), 'yyyy-MM-dd'),
  });
  const [projectId, setProjectId] = useState('');
  const { data: projects } = useProjects({ limit: appConfig.boardPageSize });
  const filters: ReportRange = { ...range, projectId: projectId || undefined };

  return (
    <>
      <PageHeader title="Reports" description="Portfolio health, resource utilization, time and quality insights." />
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Segmented<Tab>
          value={tab}
          onChange={setTab}
          options={[
            { value: 'portfolio', label: 'Portfolio' },
            { value: 'workload', label: 'Workload' },
            { value: 'time', label: 'Time' },
            { value: 'issues', label: 'Issues' },
          ]}
        />
        {tab !== 'portfolio' && (
          <>
            <Input type="date" className="w-40" value={range.from} onChange={(e) => setRange((r) => ({ ...r, from: e.target.value }))} />
            <span className="text-muted">→</span>
            <Input type="date" className="w-40" value={range.to} onChange={(e) => setRange((r) => ({ ...r, to: e.target.value }))} />
            <Select className="w-52" value={projectId} onChange={(e) => setProjectId(e.target.value)}>
              <option value="">All projects</option>
              {projects?.data.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </>
        )}
      </div>
      {tab === 'portfolio' && <PortfolioReport />}
      {tab === 'workload' && <WorkloadReportView filters={filters} />}
      {tab === 'time' && <TimeReport filters={filters} />}
      {tab === 'issues' && <IssuesReport filters={filters} />}
    </>
  );
}

function toCsv(rows: PortfolioRow[]): string {
  const header = ['Key', 'Project', 'Status', 'Owner', 'Progress %', 'Open tasks', 'Overdue', 'Open issues', 'Logged hours', 'Budget hours', 'End date', 'Health'];
  const escape = (value: string | number) => `"${String(value).replace(/"/g, '""')}"`;
  const lines = rows.map((r) =>
    [r.key, r.name, r.status.name, fullName(r.owner), r.stats.progress, r.stats.openTasks, r.stats.overdueTasks, r.openIssues, minutesToHours(r.loggedMinutes), r.budgetHours ?? '', r.endDate?.slice(0, 10) ?? '', humanize(r.health)]
      .map(escape)
      .join(','),
  );
  return [header.map(escape).join(','), ...lines].join('\n');
}

function PortfolioReport() {
  const { data, isLoading, isError, error, refetch } = usePortfolioReport();
  const healthCounts = useMemo(
    () =>
      Object.values(ProjectHealth).map((health) => ({
        id: health,
        name: humanize(health),
        color: `var(--${HEALTH_TONE[health] === 'brand' ? 'brand' : HEALTH_TONE[health]})`,
        count: data?.filter((p) => p.health === health).length ?? 0,
      })),
    [data],
  );

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const download = () => {
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: `portfolio-${format(new Date(), 'yyyy-MM-dd')}.csv` });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="Portfolio health" />
          <CardBody>
            <DonutChart data={healthCounts} height={180} />
          </CardBody>
        </Card>
        <Card className="lg:col-span-2">
          <CardHeader title="Completion by project" />
          <CardBody>
            <ColumnChart
              data={data.map((p) => ({ name: p.key, completed: p.stats.completedTasks, open: p.stats.openTasks }))}
              xKey="name"
              stacked
              series={[
                { key: 'completed', label: 'Completed', color: 'var(--success)' },
                { key: 'open', label: 'Open', color: 'var(--brand)' },
              ]}
            />
          </CardBody>
        </Card>
      </div>
      <Card>
        <CardHeader
          title="Projects"
          actions={
            <Button variant="secondary" size="sm" onClick={download}>
              <Download className="h-3.5 w-3.5" /> Export CSV
            </Button>
          }
        />
        <Table>
          <thead>
            <tr>
              <Th>Project</Th>
              <Th>Status</Th>
              <Th>Health</Th>
              <Th className="w-44">Progress</Th>
              <Th>Overdue</Th>
              <Th>Open issues</Th>
              <Th>Hours (logged / budget)</Th>
              <Th>End date</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const budgetPct = row.budgetHours ? (row.loggedMinutes / 60 / row.budgetHours) * 100 : 0;
              return (
                <Tr key={row.id}>
                  <Td>
                    <Link href={routes.project(row.id)} className="font-medium hover:text-brand">
                      <span className="mr-2 text-xs text-muted">{row.key}</span>
                      {row.name}
                    </Link>
                  </Td>
                  <Td>
                    <ColorBadge color={row.status.color} label={row.status.name} />
                  </Td>
                  <Td>
                    <Badge tone={HEALTH_TONE[row.health]}>{humanize(row.health)}</Badge>
                  </Td>
                  <Td>
                    <div className="flex items-center gap-2">
                      <ProgressBar value={row.stats.progress} />
                      <span className="w-9 text-right text-xs">{row.stats.progress}%</span>
                    </div>
                  </Td>
                  <Td className={row.stats.overdueTasks ? 'font-medium text-danger' : ''}>{row.stats.overdueTasks}</Td>
                  <Td>{row.openIssues}</Td>
                  <Td className={cn('whitespace-nowrap', budgetPct > 100 && 'font-medium text-danger')}>
                    {minutesToHours(row.loggedMinutes)}h / {row.budgetHours ? `${row.budgetHours}h` : '—'}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(row.endDate)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function WorkloadReportView({ filters }: { filters: ReportRange }) {
  const { data, isLoading, isError, error, refetch } = useWorkloadReport(filters);
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Resource utilization" description={`Capacity per person: ${formatMinutes(data.capacityMinutes)} (working days × working hours)`} />
        <CardBody>
          <ColumnChart
            data={data.rows.map((r) => ({ name: r.user.firstName, logged: minutesToHours(r.loggedMinutes), capacity: minutesToHours(data.capacityMinutes) }))}
            xKey="name"
            series={[
              { key: 'logged', label: 'Logged hours', color: 'var(--brand)' },
              { key: 'capacity', label: 'Capacity', color: 'var(--border)' },
            ]}
          />
        </CardBody>
      </Card>
      <Card>
        <Table>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th>Open tasks</Th>
              <Th>Overdue</Th>
              <Th>Remaining estimate</Th>
              <Th>Logged</Th>
              <Th className="w-56">Utilization</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <Tr key={row.user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar user={row.user} />
                    <div>
                      <p className="font-medium">{fullName(row.user)}</p>
                      <p className="text-xs text-muted">{row.user.jobTitle ?? row.user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td>{row.openTasks}</Td>
                <Td className={row.overdueTasks ? 'font-medium text-danger' : ''}>{row.overdueTasks}</Td>
                <Td>{row.estimatedHours}h</Td>
                <Td>{formatMinutes(row.loggedMinutes)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={row.utilization} color={row.utilization > 100 ? 'var(--danger)' : row.utilization < 50 ? 'var(--warning)' : 'var(--success)'} />
                    <span className="w-10 text-right text-xs font-medium">{row.utilization}%</span>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </Card>
    </div>
  );
}

function TimeReport({ filters }: { filters: ReportRange }) {
  const { data, isLoading, isError, error, refetch } = useTimeSummary(filters);
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Hours logged per day" description={`${formatMinutes(data.totalMinutes)} total · ${formatMinutes(data.billableMinutes)} billable`} />
        <CardBody>
          <ColumnChart data={data.byDay.map((d) => ({ day: formatDate(d.date, 'dd MMM'), hours: minutesToHours(d.minutes) }))} xKey="day" series={[{ key: 'hours', label: 'Hours', color: 'var(--brand)' }]} />
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader title="By project" />
          <CardBody>
            <BarList data={data.byProject.map((r) => ({ id: r.project.id, name: r.project.name, color: r.project.color ?? 'var(--brand)', count: minutesToHours(r.minutes) }))} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="By person" />
          <CardBody>
            <BarList data={data.byUser.map((r) => ({ id: r.user.id, name: fullName(r.user), color: 'var(--brand)', count: minutesToHours(r.minutes) }))} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}

function IssuesReport({ filters }: { filters: ReportRange }) {
  const { data, isLoading, isError, error, refetch } = useIssueReport(filters);
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader title="Created vs resolved per week" />
        <CardBody>
          <ColumnChart
            data={data.trend.map((t) => ({ ...t, week: formatDate(t.week, 'dd MMM') }))}
            xKey="week"
            series={[
              { key: 'created', label: 'Created', color: 'var(--danger)' },
              { key: 'resolved', label: 'Resolved', color: 'var(--success)' },
            ]}
          />
        </CardBody>
      </Card>
      <div className="grid gap-6 lg:grid-cols-3">
        <Card>
          <CardHeader title="By status" />
          <CardBody>
            <DonutChart data={data.byStatus} height={170} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="By severity" />
          <CardBody>
            <BarList data={data.bySeverity} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="By priority" />
          <CardBody>
            <BarList data={data.byPriority} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
