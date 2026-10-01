import type { Metadata } from 'next';
import { Suspense } from 'react';
import { MyWorkView } from '@/features/my-work/components/my-work-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'My work' };

export default function MyWorkPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <MyWorkView />
    </Suspense>
  );
}
