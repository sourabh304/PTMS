import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ReportsView } from '@/features/reports/components/reports-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Reports' };

export default function ReportsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ReportsView />
    </Suspense>
  );
}
