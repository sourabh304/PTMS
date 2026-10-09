import { Suspense } from 'react';
import { ProjectTable } from '@/features/tasks/components/table/project-table';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectTablePage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectTable projectId={projectId} />
    </Suspense>
  );
}
