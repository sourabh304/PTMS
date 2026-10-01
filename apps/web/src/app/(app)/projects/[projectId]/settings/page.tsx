import { Suspense } from 'react';
import { ProjectSettings } from '@/features/projects/components/project-settings';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectSettingsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectSettings projectId={projectId} />
    </Suspense>
  );
}
