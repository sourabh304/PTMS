import { Suspense } from 'react';
import { GanttChart } from '@/features/gantt/components/gantt-chart';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectGanttPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <GanttChart projectId={projectId} />
    </Suspense>
  );
}
