import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PlansView } from '@/features/plans/components/plans-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Plans' };

export default function PlatformPlansPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PlansView />
    </Suspense>
  );
}
