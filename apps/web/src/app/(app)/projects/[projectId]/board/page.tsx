import { Suspense } from 'react';
import { TaskBoard } from '@/features/tasks/components/task-board';
import { Spinner } from '@/shared/ui/feedback';

export default async function ProjectBoardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return (
    <Suspense fallback={<Spinner />}>
      <TaskBoard projectId={projectId} />
    </Suspense>
  );
}
