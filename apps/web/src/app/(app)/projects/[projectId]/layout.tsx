import type { ReactNode } from 'react';
import { ProjectWorkspace } from '@/features/projects/components/project-header';

interface Props {
  children: ReactNode;
  params: Promise<{ projectId: string }>;
}

export default async function ProjectLayout({ children, params }: Props) {
  const { projectId } = await params;
  return <ProjectWorkspace projectId={projectId}>{children}</ProjectWorkspace>;
}
