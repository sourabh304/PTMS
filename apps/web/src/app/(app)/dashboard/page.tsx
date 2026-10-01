import type { Metadata } from 'next';
import { Suspense } from 'react';
import { DashboardView } from '@/features/dashboard/components/dashboard-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Dashboard' };

export default function DashboardPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <DashboardView />
    </Suspense>
  );
}
