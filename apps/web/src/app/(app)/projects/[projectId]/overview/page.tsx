import { Suspense } from 'react';
import { ProjectOverview } from '@/features/projects/components/project-overview';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectOverviewPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectOverview projectId={projectId} />
    </Suspense>
  );
}
