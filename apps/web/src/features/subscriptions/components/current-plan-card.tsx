'use client';

import { CreditCard } from 'lucide-react';
import { formatDate, formatMoney } from '@/shared/lib/utils';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/feedback';
import { ProgressBar } from '@/shared/ui/layout';
import { useCurrentSubscription } from '../api';
import { SubscriptionStatusBadge } from './subscription-status-badge';

/** Read-only plan and usage for organization admins; plans are managed by the platform root account. */
export function CurrentPlanCard() {
  const { data, isLoading } = useCurrentSubscription();
  if (isLoading || !data) return <Card><Spinner /></Card>;
  const { subscription, usage } = data;

  return (
    <Card>
      <CardHeader
        icon={<CreditCard />}
        title="Subscription"
        description="Plans and billing are managed by the platform administrator."
        actions={subscription && <SubscriptionStatusBadge status={subscription.status} />}
      />
      <CardBody>
        {subscription ? (
          <div className="grid gap-6 md:grid-cols-[1fr_2fr]">
            <div>
              <p className="text-lg font-semibold text-foreground">{subscription.plan.name}</p>
              <p className="text-sm text-muted">
                {formatMoney(subscription.plan.priceCents, subscription.plan.currency)} / {subscription.plan.billingInterval === 'YEARLY' ? 'year' : 'month'}
              </p>
              <p className="mt-2 text-xs text-muted">
                Since {formatDate(subscription.startDate)}
                {subscription.endDate ? ` · renews or ends ${formatDate(subscription.endDate)}` : ''}
              </p>
            </div>
            <div className="space-y-4">
              <UsageMeter label="Active users" used={usage.users} limit={subscription.plan.maxUsers} />
              <UsageMeter label="Active projects" used={usage.projects} limit={subscription.plan.maxProjects} />
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted">
            Your organization has no active plan.
            {data.requireActiveSubscription && ' Adding users and projects is disabled until a plan is assigned.'}
          </p>
        )}
      </CardBody>
    </Card>
  );
}

function UsageMeter({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const percent = limit ? (used / limit) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums text-foreground">
          {used} / {limit ?? 'Unlimited'}
        </span>
      </div>
      <ProgressBar value={limit ? percent : 0} color={percent >= 100 ? 'var(--danger)' : percent >= 80 ? 'var(--warning)' : undefined} />
    </div>
  );
}
