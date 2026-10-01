import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProjectList } from '@/features/projects/components/project-list';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Projects' };

export default function ProjectsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProjectList />
    </Suspense>
  );
}
