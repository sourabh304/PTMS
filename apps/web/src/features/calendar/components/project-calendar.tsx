'use client';

import { useProject } from '@/features/projects/api';
import { TaskCalendar } from './task-calendar';

export function ProjectCalendar({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const canEdit = !!project?.access.canEdit && !project.isArchived;
  return <TaskCalendar query={{ projectId, rootOnly: true }} canEdit={canEdit} />;
}
