import type { Metadata } from 'next';
import { Suspense } from 'react';
import { SubscriptionsView } from '@/features/subscriptions/components/subscriptions-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Subscriptions' };

export default function PlatformSubscriptionsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <SubscriptionsView />
    </Suspense>
  );
}
