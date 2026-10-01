import { Suspense } from 'react';
import { TimesheetView } from '@/features/timesheets/components/timesheet-view';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectTimesheetsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <TimesheetView projectId={projectId} />
    </Suspense>
  );
}
