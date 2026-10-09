import { redirect } from 'next/navigation';
import { routes } from '@/shared/config/routes';

interface Props {
  params: Promise<{ projectId: string }>;
  searchParams: Promise<{ taskId?: string }>;
}

/** Older links (e.g. existing notifications) pointed here; the table is now the project's home. */
export default async function LegacyProjectTasksPage({ params, searchParams }: Props) {
  const [{ projectId }, { taskId }] = await Promise.all([params, searchParams]);
  redirect(taskId ? routes.projectTask(projectId, taskId) : routes.project(projectId));
}
