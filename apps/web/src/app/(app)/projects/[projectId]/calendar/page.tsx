import { Suspense } from 'react';
import { ProjectCalendar } from '@/features/calendar/components/project-calendar';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectCalendarPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectCalendar projectId={projectId} />
    </Suspense>
  );
}
