'use client';

import { format, startOfYear, subDays } from 'date-fns';
import {
  AlertTriangle,
  BarChart3,
  Bug,
  CheckCircle2,
  Clock,
  Download,
  FolderKanban,
  Gauge,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { useProjects } from '@/features/projects/api';
import { useTimeSummary } from '@/features/timesheets/api';
import { appConfig } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { Permission, ProjectHealth } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatDate, formatMinutes, fullName, humanize, minutesToHours } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge, ColorBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { FilterPopover } from '@/shared/components/filter-popover';
import { KpiStrip } from '@/shared/components/kpi-strip';
import { Card } from '@/shared/ui/card';
import { CollapsibleCard } from '@/shared/ui/collapsible';
import { BarList, ColumnChart, DonutChart } from '@/shared/ui/charts';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select } from '@/shared/ui/form';
import { PageHeader, ProgressBar, Segmented, Tabs } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useIssueReport, usePortfolioReport, useWorkloadReport, type PortfolioRow, type ReportRange } from '../api';

type Tab = 'portfolio' | 'workload' | 'time' | 'issues';

const TABS: { value: Tab; label: string; icon: ReactNode }[] = [
  { value: 'portfolio', label: 'Portfolio', icon: <FolderKanban /> },
  { value: 'workload', label: 'Workload', icon: <Users /> },
  { value: 'time', label: 'Time', icon: <Clock /> },
  { value: 'issues', label: 'Issues', icon: <Bug /> },
];

/** Reporting windows offered in the period picker. */
const PERIODS = [
  { value: '7', label: 'Last 7 days', from: () => subDays(new Date(), 7) },
  { value: '30', label: 'Last 30 days', from: () => subDays(new Date(), 30) },
  { value: '90', label: 'Last 90 days', from: () => subDays(new Date(), 90) },
  { value: 'ytd', label: 'Year to date', from: () => startOfYear(new Date()) },
  { value: 'custom', label: 'Custom range', from: null },
] as const;
type Period = (typeof PERIODS)[number]['value'];
const DEFAULT_PERIOD: Period = '30';

const iso = (date: Date) => format(date, 'yyyy-MM-dd');

/** Padding for chart bodies inside collapsible cards. */
const BODY = 'p-[var(--card-p)]';

/** Health → semantic tone. Colors come from theme tokens so they adapt to light/dark mode. */
const HEALTH_TONE = {
  [ProjectHealth.ON_TRACK]: 'success',
  [ProjectHealth.AT_RISK]: 'warning',
  [ProjectHealth.OFF_TRACK]: 'danger',
  [ProjectHealth.COMPLETED]: 'neutral',
} as const;
const HEALTH_COLOR: Record<ProjectHealth, string> = {
  [ProjectHealth.ON_TRACK]: 'var(--success)',
  [ProjectHealth.AT_RISK]: 'var(--warning)',
  [ProjectHealth.OFF_TRACK]: 'var(--danger)',
  [ProjectHealth.COMPLETED]: 'var(--muted)',
};

/** Two clearly distinct shades of the brand color, whatever accent is selected. */
const SERIES = {
  primary: 'var(--brand)',
  secondary: 'color-mix(in srgb, var(--brand) 28%, var(--surface))',
  neutral: 'color-mix(in srgb, var(--muted) 30%, var(--surface))',
};

export function ReportsView() {
  const { can, user } = usePermissions();
  if (!user) return <Spinner />;
  if (!can(Permission.REPORTS_VIEW)) return <EmptyState icon={<BarChart3 />} title="Only project coordinators can view reports" />;
  return <ReportsContent />;
}

function ReportsContent() {
  const [tab, setTab] = useState<Tab>('portfolio');
  const [period, setPeriod] = useState<Period>(DEFAULT_PERIOD);
  const [custom, setCustom] = useState({ from: iso(subDays(new Date(), 30)), to: iso(new Date()) });
  const [projectId, setProjectId] = useState('');
  const { data: projects } = useProjects({ limit: appConfig.boardPageSize });

  const filters: ReportRange = useMemo(() => {
    const preset = PERIODS.find((p) => p.value === period);
    const range = preset?.from ? { from: iso(preset.from()), to: iso(new Date()) } : custom;
    return { ...range, projectId: projectId || undefined };
  }, [period, custom, projectId]);
  const periodLabel = period === 'custom' ? `${formatDate(custom.from, 'dd MMM')} – ${formatDate(custom.to, 'dd MMM')}` : PERIODS.find((p) => p.value === period)?.label;
  const projectName = projects?.data.find((p) => p.id === projectId)?.name ?? 'All projects';

  return (
    <>
      <PageHeader title="Reports" description="Portfolio health, resource utilization, time and quality insights." />

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <Tabs value={tab} onChange={setTab} items={TABS} className="min-w-0 sm:flex-1" />
        {tab !== 'portfolio' && (
          <FilterPopover
            align="end"
            summary={`${periodLabel} · ${projectName}`}
            activeCount={(period !== DEFAULT_PERIOD ? 1 : 0) + (projectId ? 1 : 0)}
            onReset={() => {
              setPeriod(DEFAULT_PERIOD);
              setProjectId('');
            }}
          >
            <Field label="Period">
              <Select value={period} onChange={(e) => setPeriod(e.target.value as Period)}>
                {PERIODS.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </Select>
            </Field>
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="From">
                  <Input type="date" value={custom.from} max={custom.to} onChange={(e) => setCustom((r) => ({ ...r, from: e.target.value }))} />
                </Field>
                <Field label="To">
                  <Input type="date" value={custom.to} min={custom.from} onChange={(e) => setCustom((r) => ({ ...r, to: e.target.value }))} />
                </Field>
              </div>
            )}
            <Field label="Project">
              <Select value={projectId} onChange={(e) => setProjectId(e.target.value)}>
                <option value="">All projects</option>
                {projects?.data.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
            </Field>
          </FilterPopover>
        )}
      </div>

      {tab === 'portfolio' && <PortfolioReport />}
      {tab === 'workload' && <WorkloadReportView filters={filters} />}
      {tab === 'time' && <TimeReport filters={filters} />}
      {tab === 'issues' && <IssuesReport filters={filters} />}
    </>
  );
}

function RangeCaption({ from, to }: { from?: string; to?: string }) {
  return (
    <>
      {formatDate(from)} – {formatDate(to)}
    </>
  );
}

// ─── Portfolio ──────────────────────────────────────────────────

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

  const summary = useMemo(() => {
    const rows = data ?? [];
    const loggedMinutes = rows.reduce((sum, r) => sum + r.loggedMinutes, 0);
    const budgetHours = rows.reduce((sum, r) => sum + (r.budgetHours ?? 0), 0);
    return {
      projects: rows.length,
      avgProgress: rows.length ? Math.round(rows.reduce((sum, r) => sum + r.stats.progress, 0) / rows.length) : 0,
      loggedMinutes,
      budgetHours,
      attention: rows.filter((r) => r.health === ProjectHealth.AT_RISK || r.health === ProjectHealth.OFF_TRACK).length,
      health: Object.values(ProjectHealth).map((health) => ({
        id: health,
        name: humanize(health),
        color: HEALTH_COLOR[health],
        count: rows.filter((p) => p.health === health).length,
      })),
    };
  }, [data]);

  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  if (!data.length) return <Card><EmptyState icon={<FolderKanban />} title="No active projects" description="Portfolio insights appear once projects exist." /></Card>;

  const download = () => {
    const blob = new Blob([toCsv(data)], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: `portfolio-${iso(new Date())}.csv` });
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: 'Active projects', value: summary.projects, icon: <FolderKanban /> },
          { label: 'Average progress', value: `${summary.avgProgress}%`, icon: <TrendingUp />, tone: 'success' },
          {
            label: 'Hours logged',
            value: `${minutesToHours(summary.loggedMinutes)}h`,
            icon: <Wallet />,
            tone: 'warning',
            hint: summary.budgetHours ? `of ${summary.budgetHours}h budgeted` : 'No budgets set',
          },
          { label: 'Need attention', value: summary.attention, icon: <AlertTriangle />, tone: 'danger', hint: 'At risk or off track' },
        ]}
      />

      <div className="grid gap-6 xl:grid-cols-5">
        <CollapsibleCard className="xl:col-span-2" storageKey="reports.portfolio.health" title="Portfolio health" description="Based on overdue work, schedule and budget burn" bodyClassName={BODY}>
          <DonutChart data={summary.health} height={176} />
        </CollapsibleCard>
        <CollapsibleCard className="xl:col-span-3" storageKey="reports.portfolio.completion" title="Completion by project" description="Completed vs open tasks" bodyClassName={BODY}>
            <ColumnChart
              data={data.map((p) => ({ name: p.key, completed: p.stats.completedTasks, open: p.stats.openTasks }))}
              xKey="name"
              stacked
              height={240}
              series={[
                { key: 'completed', label: 'Completed', color: SERIES.primary },
                { key: 'open', label: 'Open', color: SERIES.secondary },
              ]}
            />
        </CollapsibleCard>
      </div>

      <CollapsibleCard
        storageKey="reports.portfolio.projects"
        title="Projects"
        meta={`${data.length} active`}
        actions={
          <Button variant="secondary" size="sm" onClick={download}>
            <Download /> <span className="hidden sm:inline">Export CSV</span>
          </Button>
        }
      >
        <Table>
          <thead>
            <tr>
              <Th>Project</Th>
              <Th>Status</Th>
              <Th>Health</Th>
              <Th className="min-w-44">Progress</Th>
              <Th className="text-right">Overdue</Th>
              <Th className="text-right">Open issues</Th>
              <Th className="min-w-44">Budget</Th>
              <Th>End date</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => {
              const budgetPct = row.budgetHours ? (row.loggedMinutes / 60 / row.budgetHours) * 100 : 0;
              return (
                <Tr key={row.id}>
                  <Td>
                    <Link href={routes.project(row.id)} className="group flex items-center gap-2.5">
                      <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: row.color ?? 'var(--brand)' }} />
                      <span className="min-w-0">
                        <span className="block truncate font-medium text-foreground group-hover:text-brand">{row.name}</span>
                        <span className="block font-mono text-xs text-muted">{row.key}</span>
                      </span>
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
                      <span className="w-9 text-right text-xs tabular-nums">{row.stats.progress}%</span>
                    </div>
                  </Td>
                  <Td className={cn('text-right tabular-nums', row.stats.overdueTasks && 'font-medium text-danger')}>{row.stats.overdueTasks}</Td>
                  <Td className="text-right tabular-nums">{row.openIssues}</Td>
                  <Td>
                    {row.budgetHours ? (
                      <div>
                        <div className="mb-1 flex justify-between text-xs tabular-nums">
                          <span>{minutesToHours(row.loggedMinutes)}h</span>
                          <span className="text-muted">{row.budgetHours}h</span>
                        </div>
                        <ProgressBar value={budgetPct} color={budgetPct > 100 ? 'var(--danger)' : budgetPct > 90 ? 'var(--warning)' : undefined} />
                      </div>
                    ) : (
                      <span className="text-xs text-muted">{minutesToHours(row.loggedMinutes)}h · no budget</span>
                    )}
                  </Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(row.endDate)}</Td>
                </Tr>
              );
            })}
          </tbody>
        </Table>
      </CollapsibleCard>
    </div>
  );
}

// ─── Workload ───────────────────────────────────────────────────

function WorkloadReportView({ filters }: { filters: ReportRange }) {
  const { data, isLoading, isError, error, refetch } = useWorkloadReport(filters);
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const totalLogged = data.rows.reduce((sum, r) => sum + r.loggedMinutes, 0);
  const avgUtilization = data.rows.length ? Math.round(data.rows.reduce((sum, r) => sum + r.utilization, 0) / data.rows.length) : 0;
  const overloaded = data.rows.filter((r) => r.utilization > 100).length;

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: 'Team members', value: data.rows.length, icon: <Users /> },
          { label: 'Capacity per person', value: formatMinutes(data.capacityMinutes), icon: <Gauge />, hint: <span title="Working days × hours per day">days × hours</span> },
          { label: 'Total logged', value: formatMinutes(totalLogged), icon: <Clock />, tone: 'warning' },
          { label: 'Avg. utilization', value: `${avgUtilization}%`, icon: <BarChart3 />, tone: overloaded ? 'danger' : 'success', hint: `${overloaded} over capacity` },
        ]}
      />

      <CollapsibleCard storageKey="reports.workload.chart" title="Resource utilization" description={<RangeCaption from={filters.from} to={filters.to} />} bodyClassName={BODY}>
          <ColumnChart
            data={data.rows.map((r) => ({ name: r.user.firstName, logged: minutesToHours(r.loggedMinutes), capacity: minutesToHours(data.capacityMinutes) }))}
            xKey="name"
            formatValue={(v) => `${v}h`}
            series={[
              { key: 'logged', label: 'Logged hours', color: SERIES.primary },
              { key: 'capacity', label: 'Capacity', color: SERIES.neutral },
            ]}
          />
      </CollapsibleCard>

      <CollapsibleCard storageKey="reports.workload.people" title="People" meta={data.rows.length} description="Open work and time logged in the selected period">
        <Table>
          <thead>
            <tr>
              <Th>Person</Th>
              <Th className="text-right">Open tasks</Th>
              <Th className="text-right">Overdue</Th>
              <Th className="text-right">Remaining estimate</Th>
              <Th className="text-right">Logged</Th>
              <Th className="min-w-52">Utilization</Th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <Tr key={row.user.id}>
                <Td>
                  <div className="flex items-center gap-3">
                    <Avatar user={row.user} size="md" />
                    <div className="min-w-0">
                      <p className="truncate font-medium text-foreground">{fullName(row.user)}</p>
                      <p className="truncate text-xs text-muted">{row.user.jobTitle ?? row.user.email}</p>
                    </div>
                  </div>
                </Td>
                <Td className="text-right tabular-nums">{row.openTasks}</Td>
                <Td className={cn('text-right tabular-nums', row.overdueTasks && 'font-medium text-danger')}>{row.overdueTasks}</Td>
                <Td className="text-right tabular-nums">{row.estimatedHours}h</Td>
                <Td className="text-right tabular-nums">{formatMinutes(row.loggedMinutes)}</Td>
                <Td>
                  <div className="flex items-center gap-2">
                    <ProgressBar value={row.utilization} color={row.utilization > 100 ? 'var(--danger)' : row.utilization < 50 ? 'var(--warning)' : 'var(--success)'} />
                    <span className="w-10 text-right text-xs font-medium tabular-nums">{row.utilization}%</span>
                  </div>
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      </CollapsibleCard>
    </div>
  );
}

// ─── Time ───────────────────────────────────────────────────────

function TimeReport({ filters }: { filters: ReportRange }) {
  const { data, isLoading, isError, error, refetch } = useTimeSummary(filters);
  const [breakdown, setBreakdown] = useState<'project' | 'person'>('project');
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const billablePct = data.totalMinutes ? Math.round((data.billableMinutes / data.totalMinutes) * 100) : 0;
  const activeDays = data.byDay.filter((d) => d.minutes > 0).length;

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: 'Total logged', value: formatMinutes(data.totalMinutes), icon: <Clock />, hint: `${data.entries} entries` },
          { label: 'Billable', value: formatMinutes(data.billableMinutes), icon: <Receipt />, tone: 'success', hint: `${billablePct}% of total` },
          { label: 'Non-billable', value: formatMinutes(data.totalMinutes - data.billableMinutes), icon: <Wallet />, tone: 'warning' },
          { label: 'Daily average', value: formatMinutes(activeDays ? data.totalMinutes / activeDays : 0), icon: <TrendingUp />, hint: `${activeDays} active days` },
        ]}
      />

      <CollapsibleCard storageKey="reports.time.chart" title="Hours logged per day" description={<RangeCaption from={filters.from} to={filters.to} />} bodyClassName={BODY}>
          <ColumnChart
            data={data.byDay.map((d) => ({ day: formatDate(d.date, 'dd MMM'), hours: minutesToHours(d.minutes) }))}
            xKey="day"
            formatValue={(v) => `${v}h`}
            series={[{ key: 'hours', label: 'Hours', color: SERIES.primary }]}
          />
      </CollapsibleCard>

      <CollapsibleCard
        storageKey="reports.time.breakdown"
        title="Hours breakdown"
        meta={breakdown === 'project' ? 'By project' : 'By person'}
        actions={
          <Segmented<'project' | 'person'>
            aria-label="Group hours by"
            value={breakdown}
            onChange={setBreakdown}
            options={[
              { value: 'project', label: 'Project' },
              { value: 'person', label: 'Person' },
            ]}
          />
        }
        bodyClassName={BODY}
      >
        {breakdown === 'project' ? (
          <BarList data={data.byProject.map((r) => ({ id: r.project.id, name: r.project.name, color: r.project.color ?? SERIES.primary, count: minutesToHours(r.minutes) }))} />
        ) : (
          <BarList data={data.byUser.map((r) => ({ id: r.user.id, name: fullName(r.user), color: SERIES.primary, count: minutesToHours(r.minutes) }))} />
        )}
      </CollapsibleCard>
    </div>
  );
}

// ─── Issues ─────────────────────────────────────────────────────

function IssuesReport({ filters }: { filters: ReportRange }) {
  const { data, isLoading, isError, error, refetch } = useIssueReport(filters);
  const [breakdown, setBreakdown] = useState<'status' | 'severity' | 'priority'>('status');
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const created = data.trend.reduce((sum, t) => sum + t.created, 0);
  const resolved = data.trend.reduce((sum, t) => sum + t.resolved, 0);
  const total = data.byStatus.reduce((sum, s) => sum + s.count, 0);

  return (
    <div className="space-y-6">
      <KpiStrip
        items={[
          { label: 'Total issues', value: total, icon: <Bug /> },
          { label: 'Created in period', value: created, icon: <AlertTriangle />, tone: 'danger' },
          { label: 'Resolved in period', value: resolved, icon: <CheckCircle2 />, tone: 'success' },
          { label: 'Net change', value: `${created - resolved > 0 ? '+' : ''}${created - resolved}`, icon: <TrendingUp />, tone: created > resolved ? 'warning' : 'success', hint: 'created − resolved' },
        ]}
      />

      <CollapsibleCard storageKey="reports.issues.trend" title="Created vs resolved" description="Per week" bodyClassName={BODY}>
          <ColumnChart
            data={data.trend.map((t) => ({ ...t, week: formatDate(t.week, 'dd MMM') }))}
            xKey="week"
            series={[
              { key: 'created', label: 'Created', color: 'var(--danger)' },
              { key: 'resolved', label: 'Resolved', color: 'var(--success)' },
            ]}
          />
      </CollapsibleCard>

      <CollapsibleCard
        storageKey="reports.issues.breakdown"
        title="Issue breakdown"
        meta={`By ${breakdown}`}
        actions={
          <Segmented<'status' | 'severity' | 'priority'>
            aria-label="Group issues by"
            value={breakdown}
            onChange={setBreakdown}
            options={[
              { value: 'status', label: 'Status' },
              { value: 'severity', label: 'Severity' },
              { value: 'priority', label: 'Priority' },
            ]}
          />
        }
        bodyClassName={BODY}
      >
        <div className="mx-auto max-w-2xl">
          {breakdown === 'status' && <DonutChart data={data.byStatus} height={160} />}
          {breakdown === 'severity' && <BarList data={data.bySeverity} />}
          {breakdown === 'priority' && <BarList data={data.byPriority} />}
        </div>
      </CollapsibleCard>
    </div>
  );
}
