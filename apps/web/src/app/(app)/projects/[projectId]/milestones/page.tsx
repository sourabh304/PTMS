import { Suspense } from 'react';
import { MilestoneBoard } from '@/features/milestones/components/milestone-board';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectMilestonesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <MilestoneBoard projectId={projectId} />
    </Suspense>
  );
}
