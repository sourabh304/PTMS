'use client';

import { Building2, CreditCard, FolderKanban, Users } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/shared/config/routes';
import { SubscriptionStatus } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { formatMoney, humanize, timeAgo } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { BarList } from '@/shared/ui/charts';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { PageHeader, StatCard } from '@/shared/ui/layout';
import { usePlatformOverview } from '../api';

const STATUS_COLORS: Record<SubscriptionStatus, string> = {
  [SubscriptionStatus.TRIAL]: 'var(--brand)',
  [SubscriptionStatus.ACTIVE]: 'var(--success)',
  [SubscriptionStatus.PAST_DUE]: 'var(--warning)',
  [SubscriptionStatus.CANCELED]: 'var(--muted)',
  [SubscriptionStatus.EXPIRED]: 'var(--danger)',
};

export function PlatformOverview() {
  const { data, isLoading, isError, error, refetch } = usePlatformOverview();
  if (isLoading) return <Spinner />;
  if (isError || !data) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const mrr = data.mrr.length ? data.mrr.map((m) => formatMoney(m.amountCents, m.currency)).join(' + ') : formatMoney(0, 'USD');

  return (
    <>
      <PageHeader title="Platform overview" description="Every organization, plan and subscription on this installation." />
      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        <StatCard
          label="Organizations"
          value={data.organizations.total}
          icon={<Building2 />}
          hint={`${data.organizations.active} active · ${data.organizations.suspended} suspended`}
        />
        <StatCard label="Users" value={data.users} icon={<Users />} tone="success" hint="Across all organizations" />
        <StatCard label="Projects" value={data.projects} icon={<FolderKanban />} tone="warning" />
        <StatCard label="Monthly recurring revenue" value={mrr} icon={<CreditCard />} hint={`${data.currentSubscriptions} current subscriptions`} />
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-5">
        <Card className="xl:col-span-2">
          <CardHeader
            title="Subscriptions by status"
            actions={
              <Link href={routes.platformSubscriptions} className="text-xs font-medium text-brand hover:underline">
                Manage
              </Link>
            }
          />
          <CardBody>
            <BarList
              data={data.subscriptionsByStatus.map((s) => ({ id: s.status, name: humanize(s.status), color: STATUS_COLORS[s.status], count: s.count }))}
              emptyLabel="No subscriptions yet"
            />
          </CardBody>
        </Card>
        <Card className="xl:col-span-3">
          <CardHeader
            title="Newest organizations"
            actions={
              <Link href={routes.platformOrganizations} className="text-xs font-medium text-brand hover:underline">
                View all
              </Link>
            }
          />
          <ul className="divide-y divide-border">
            {data.recentOrganizations.map((org) => (
              <li key={org.id}>
                <Link href={`${routes.platformOrganizations}?org=${org.id}`} className="flex items-center gap-3 px-[var(--card-p)] py-3 transition-colors hover:bg-surface-hover">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-ui bg-surface-muted text-xs font-semibold uppercase text-foreground-soft">
                    {org.name.slice(0, 2)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-foreground">{org.name}</span>
                    <span className="block text-xs text-muted">
                      {org._count.users} users · created {timeAgo(org.createdAt)}
                    </span>
                  </span>
                  {org.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </>
  );
}
