import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TimesheetView } from '@/features/timesheets/components/timesheet-view';
import { Spinner } from '@/shared/ui/feedback';
import { PageHeader } from '@/shared/ui/layout';

export const metadata: Metadata = { title: 'Timesheets' };

export default function TimesheetsPage() {
  return (
    <>
      <PageHeader title="Timesheets" description="Log, review and approve time across projects." />
      <Suspense fallback={<Spinner />}>
        <TimesheetView />
      </Suspense>
    </>
  );
}
