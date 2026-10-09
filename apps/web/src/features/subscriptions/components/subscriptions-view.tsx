'use client';

import { CreditCard, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePlans } from '@/features/plans/api';
import { appConfig } from '@/shared/config/env';
import { SubscriptionStatus } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, formatMoney, humanize } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Input, Select } from '@/shared/ui/form';
import { PageHeader, Pagination, Toolbar } from '@/shared/ui/layout';
import { ConfirmDialog } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useDeleteSubscription, useSubscriptions } from '../api';
import type { Subscription } from '../types';
import { SubscriptionFormModal } from './subscription-form-modal';
import { SubscriptionStatusBadge } from './subscription-status-badge';

export function SubscriptionsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [planId, setPlanId] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Subscription | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Subscription | null>(null);
  const debounced = useDebounce(search);
  const { data: plans } = usePlans(true);
  const remove = useDeleteSubscription();

  useEffect(() => setPage(1), [debounced, status, planId]);

  const { data, isLoading, isError, error, refetch } = useSubscriptions({
    search: debounced || undefined,
    status: (status || undefined) as SubscriptionStatus | undefined,
    planId: planId || undefined,
    page,
    limit: appConfig.defaultPageSize,
  });

  return (
    <>
      <PageHeader
        title="Subscriptions"
        description="Plans assigned to organizations. Each organization has at most one current subscription."
        actions={
          <Button onClick={() => setEditing('new')}>
            <Plus /> Assign plan
          </Button>
        }
      />
      <Toolbar>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search organization or plan" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select aria-label="Status" className="w-40" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">All statuses</option>
          {Object.values(SubscriptionStatus).map((s) => (
            <option key={s} value={s}>
              {humanize(s)}
            </option>
          ))}
        </Select>
        <Select aria-label="Plan" className="w-44" value={planId} onChange={(e) => setPlanId(e.target.value)}>
          <option value="">All plans</option>
          {plans?.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </Select>
      </Toolbar>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : !data?.data.length ? (
          <EmptyState icon={<CreditCard />} title="No subscriptions found" description="Assign a plan to an organization to get started." />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Organization</Th>
                  <Th>Plan</Th>
                  <Th>Status</Th>
                  <Th className="text-right">Price</Th>
                  <Th>Period</Th>
                  <Th className="w-24" />
                </tr>
              </thead>
              <tbody>
                {data.data.map((s) => (
                  <Tr key={s.id}>
                    <Td>
                      <p className="font-medium text-foreground">{s.organization?.name}</p>
                      <p className="font-mono text-xs text-muted">{s.organization?.slug}</p>
                    </Td>
                    <Td>
                      <p className="font-medium text-foreground">{s.plan.name}</p>
                      <p className="font-mono text-xs text-muted">{s.plan.code}</p>
                    </Td>
                    <Td>
                      <SubscriptionStatusBadge status={s.status} />
                    </Td>
                    <Td className="whitespace-nowrap text-right tabular-nums">
                      {formatMoney(s.plan.priceCents, s.plan.currency)}
                      <span className="text-xs text-muted"> / {s.plan.billingInterval === 'YEARLY' ? 'yr' : 'mo'}</span>
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {formatDate(s.startDate)} – {s.endDate ? formatDate(s.endDate) : 'Open-ended'}
                    </Td>
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit subscription" onClick={() => setEditing(s)}>
                          <Pencil />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete subscription" onClick={() => setDeleting(s)}>
                          <Trash2 className="text-danger" />
                        </Button>
                      </div>
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} itemLabel="subscriptions" onPageChange={setPage} />
          </>
        )}
      </Card>

      <SubscriptionFormModal open={!!editing} onClose={() => setEditing(null)} subscription={editing && editing !== 'new' ? editing : undefined} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete subscription"
        message={`Delete the ${deleting?.plan.name} subscription of ${deleting?.organization?.name}? To keep history, set its status to Canceled instead.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}
