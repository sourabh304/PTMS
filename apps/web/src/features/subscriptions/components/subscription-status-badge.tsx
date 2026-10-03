import { SubscriptionStatus } from '@/shared/constants/domain';
import { humanize } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';

const TONES: Record<SubscriptionStatus, 'brand' | 'success' | 'warning' | 'neutral' | 'danger'> = {
  [SubscriptionStatus.TRIAL]: 'brand',
  [SubscriptionStatus.ACTIVE]: 'success',
  [SubscriptionStatus.PAST_DUE]: 'warning',
  [SubscriptionStatus.CANCELED]: 'neutral',
  [SubscriptionStatus.EXPIRED]: 'danger',
};

export function SubscriptionStatusBadge({ status }: { status: SubscriptionStatus }) {
  return <Badge tone={TONES[status]}>{humanize(status)}</Badge>;
}
