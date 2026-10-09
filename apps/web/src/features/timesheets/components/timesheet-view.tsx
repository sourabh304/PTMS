'use client';

import { addDays, differenceInCalendarDays, endOfMonth, endOfWeek, format, isValid, startOfMonth, startOfWeek, subMonths, subWeeks } from 'date-fns';
import { Check, Clock, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useSession } from '@/features/auth/api';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { useProject } from '@/features/projects/api';
import { useActiveUsers } from '@/features/users/api';
import { appConfig } from '@/shared/config/env';
import { ApprovalStatus, Permission } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, formatMinutes, fullName, humanize, minutesToHours } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { ColumnChart } from '@/shared/ui/charts';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Input, Select } from '@/shared/ui/form';
import { Pagination, Segmented, StatCard } from '@/shared/ui/layout';
import { ConfirmDialog } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useDeleteTimeEntry, useReviewTimeEntry, useTimeEntries, useTimeSummary } from '../api';
import type { TimeEntry } from '../types';
import { TimeEntryModal } from './time-entry-modal';

type RangePreset = 'this-week' | 'last-week' | 'this-month' | 'last-month' | 'custom';

const APPROVAL_TONE = {
  [ApprovalStatus.PENDING]: 'warning',
  [ApprovalStatus.APPROVED]: 'success',
  [ApprovalStatus.REJECTED]: 'danger',
} as const;

const iso = (date: Date) => format(date, 'yyyy-MM-dd');

function resolveRange(preset: RangePreset, weekStartsOn: number, custom: { from: string; to: string }) {
  const now = new Date();
  const opts = { weekStartsOn: weekStartsOn as 0 | 1 | 2 | 3 | 4 | 5 | 6 };
  switch (preset) {
    case 'this-week':
      return { from: iso(startOfWeek(now, opts)), to: iso(endOfWeek(now, opts)) };
    case 'last-week': {
      const last = subWeeks(now, 1);
      return { from: iso(startOfWeek(last, opts)), to: iso(endOfWeek(last, opts)) };
    }
    case 'this-month':
      return { from: iso(startOfMonth(now)), to: iso(endOfMonth(now)) };
    case 'last-month': {
      const last = subMonths(now, 1);
      return { from: iso(startOfMonth(last)), to: iso(endOfMonth(last)) };
    }
    default:
      return custom;
  }
}

const MAX_CHART_DAYS = 92;

/** One bar per day of the range (empty days included), so gaps in logged time are visible. */
function dailyHours(byDay: { date: string; minutes: number }[], range: { from: string; to: string }) {
  const start = new Date(`${range.from}T00:00:00`);
  const end = new Date(`${range.to}T00:00:00`);
  const days = differenceInCalendarDays(end, start) + 1;
  if (!isValid(start) || !isValid(end) || days < 1 || days > MAX_CHART_DAYS) {
    return byDay.map((d) => ({ day: formatDate(d.date, 'dd MMM'), hours: minutesToHours(d.minutes) }));
  }
  const minutesByDate = new Map(byDay.map((d) => [d.date.slice(0, 10), d.minutes]));
  return Array.from({ length: days }, (_, i) => {
    const date = addDays(start, i);
    return { day: format(date, days <= 7 ? 'EEE d' : 'd MMM'), hours: minutesToHours(minutesByDate.get(iso(date)) ?? 0) };
  });
}

export function TimesheetView({ projectId }: { projectId?: string }) {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const { data: project } = useProject(projectId ?? '');
  const canSeeOthers = can(Permission.TIMESHEETS_VIEW_ALL) || !!project?.access.canManage;
  const canApprove = can(Permission.TIMESHEETS_APPROVE) || !!project?.access.canManage;
  const { data: users } = useActiveUsers();

  const [preset, setPreset] = useState<RangePreset>('this-week');
  const [custom, setCustom] = useState({ from: iso(addDays(new Date(), -13)), to: iso(new Date()) });
  const [userId, setUserId] = useState('');
  const [approvalStatus, setApprovalStatus] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<TimeEntry | 'new' | null>(null);
  const [deleting, setDeleting] = useState<TimeEntry | null>(null);
  const review = useReviewTimeEntry();
  const remove = useDeleteTimeEntry();

  const range = useMemo(() => resolveRange(preset, session?.organization?.weekStartsOn ?? 1, custom), [preset, session, custom]);
  const filters = {
    projectId,
    ...range,
    userId: canSeeOthers ? userId || undefined : undefined,
    mine: canSeeOthers ? undefined : true,
    approvalStatus: (approvalStatus || undefined) as ApprovalStatus | undefined,
  };
  const { data, isLoading, isError, error, refetch } = useTimeEntries({ ...filters, page, limit: appConfig.defaultPageSize });
  const { data: summary } = useTimeSummary(filters);

  const chartData = useMemo(() => dailyHours(summary?.byDay ?? [], range), [summary, range]);

  const editable = (entry: TimeEntry) => entry.userId === session?.id && entry.approvalStatus !== ApprovalStatus.APPROVED;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex min-w-0 flex-wrap items-center gap-3">
          <Segmented<RangePreset>
            value={preset}
            onChange={(value) => {
              setPreset(value);
              setPage(1);
            }}
            options={[
              { value: 'this-week', label: 'This week' },
              { value: 'last-week', label: 'Last week' },
              { value: 'this-month', label: 'This month' },
              { value: 'last-month', label: 'Last month' },
              { value: 'custom', label: 'Custom' },
            ]}
          />
          {preset === 'custom' && (
            <div className="flex items-center gap-2">
              <Input type="date" className="w-40" value={custom.from} onChange={(e) => setCustom((c) => ({ ...c, from: e.target.value }))} />
              <span className="text-muted">→</span>
              <Input type="date" className="w-40" value={custom.to} onChange={(e) => setCustom((c) => ({ ...c, to: e.target.value }))} />
            </div>
          )}
          {canSeeOthers && (
            <Select className="w-44" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Everyone</option>
              {users?.data.map((u) => (
                <option key={u.id} value={u.id}>
                  {fullName(u)}
                </option>
              ))}
            </Select>
          )}
          <Select className="w-40" value={approvalStatus} onChange={(e) => setApprovalStatus(e.target.value)}>
            <option value="">Any approval</option>
            {Object.values(ApprovalStatus).map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </Select>
        </div>
        <Button onClick={() => setEditing('new')} disabled={!!project && (!project.access.canEdit || project.isArchived)}>
          <Plus className="size-4" /> Log time
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <StatCard label="Total logged" value={formatMinutes(summary?.totalMinutes)} icon={<Clock className="size-5" />} hint={`${summary?.entries ?? 0} entries`} />
        <StatCard label="Billable" value={formatMinutes(summary?.billableMinutes)} icon={<Check className="size-5" />} tone="success" />
        <StatCard
          label="Non-billable"
          value={formatMinutes((summary?.totalMinutes ?? 0) - (summary?.billableMinutes ?? 0))}
          icon={<X className="size-5" />}
          tone="warning"
        />
      </div>

      <Card>
        <CardHeader title="Hours per day" description={`${formatDate(range.from)} → ${formatDate(range.to)}`} />
        <CardBody>
          {summary?.totalMinutes ? (
            <ColumnChart data={chartData} xKey="day" series={[{ key: 'hours', label: 'Hours', color: 'var(--brand)' }]} height={220} />
          ) : (
            <EmptyState icon={<Clock className="h-6 w-6" />} title="No time logged in this period" description="Use “Log time” to record the hours you worked." className="py-8" />
          )}
        </CardBody>
      </Card>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : !data?.data.length ? (
          <EmptyState icon={<Clock className="size-6" />} title="No time logged in this period" />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Date</Th>
                  <Th>Person</Th>
                  {!projectId && <Th>Project</Th>}
                  <Th>Work item</Th>
                  <Th>Notes</Th>
                  <Th className="text-right">Duration</Th>
                  <Th>Status</Th>
                  <Th className="w-28" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((entry) => (
                  <Tr key={entry.id}>
                    <Td className="whitespace-nowrap">{formatDate(entry.date)}</Td>
                    <Td>
                      <span className="flex items-center gap-2 whitespace-nowrap">
                        <Avatar user={entry.user} size="xs" /> {fullName(entry.user)}
                      </span>
                    </Td>
                    {!projectId && <Td className="whitespace-nowrap">{entry.project.name}</Td>}
                    <Td className="max-w-56 truncate text-sm">
                      {entry.task ? `${entry.project.key}-${entry.task.number} ${entry.task.title}` : entry.issue ? `${entry.project.key}-BUG-${entry.issue.number} ${entry.issue.title}` : <span className="text-muted">General</span>}
                    </Td>
                    <Td className="max-w-64 truncate text-sm text-muted" title={entry.notes ?? ''}>
                      {entry.notes ?? '—'}
                    </Td>
                    <Td className="whitespace-nowrap text-right font-medium">
                      {formatMinutes(entry.minutes)}
                      {!entry.isBillable && <span className="block text-xs font-normal text-muted" title="Not billed to the client">Non-billable</span>}
                    </Td>
                    <Td>
                      <Badge tone={APPROVAL_TONE[entry.approvalStatus]}>{humanize(entry.approvalStatus)}</Badge>
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        {canApprove && entry.userId !== session?.id && entry.approvalStatus !== ApprovalStatus.APPROVED && (
                          <Button variant="ghost" size="icon" aria-label="Approve" onClick={() => review.mutate({ id: entry.id, status: ApprovalStatus.APPROVED })}>
                            <Check className="size-4 text-success" />
                          </Button>
                        )}
                        {canApprove && entry.userId !== session?.id && entry.approvalStatus !== ApprovalStatus.REJECTED && (
                          <Button variant="ghost" size="icon" aria-label="Reject" onClick={() => review.mutate({ id: entry.id, status: ApprovalStatus.REJECTED })}>
                            <X className="size-4 text-danger" />
                          </Button>
                        )}
                        {editable(entry) && (
                          <>
                            <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(entry)}>
                              <Pencil className="size-4" />
                            </Button>
                            <Button variant="ghost" size="icon" aria-label="Delete" onClick={() => setDeleting(entry)}>
                              <Trash2 className="size-4 text-danger" />
                            </Button>
                          </>
                        )}
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
          </>
        )}
      </Card>

      <TimeEntryModal open={!!editing} onClose={() => setEditing(null)} entry={editing && editing !== 'new' ? editing : undefined} projectId={projectId} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete time entry"
        message="This time entry will be permanently removed."
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
