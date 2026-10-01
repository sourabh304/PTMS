import { Suspense } from 'react';
import { ProjectTaskList } from '@/features/tasks/components/project-task-list';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectTasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectTaskList projectId={projectId} />
    </Suspense>
  );
}
