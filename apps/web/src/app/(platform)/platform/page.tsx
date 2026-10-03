import type { Metadata } from 'next';
import { Suspense } from 'react';
import { PlatformOverview } from '@/features/platform/components/platform-overview';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Overview' };

export default function PlatformOverviewPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <PlatformOverview />
    </Suspense>
  );
}
