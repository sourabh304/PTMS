import { Suspense } from 'react';
import { WorkloadView } from '@/features/workload/components/workload-view';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectWorkloadPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <WorkloadView projectId={projectId} />
    </Suspense>
  );
}
