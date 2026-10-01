import { Suspense } from 'react';
import { ProjectIssues } from '@/features/issues/components/project-issues';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectIssuesPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectIssues projectId={projectId} />
    </Suspense>
  );
}
