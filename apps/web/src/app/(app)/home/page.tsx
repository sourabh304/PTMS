import type { Metadata } from 'next';
import { Suspense } from 'react';
import { HomeView } from '@/features/home/components/home-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Home' };

export default function HomePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <HomeView />
    </Suspense>
  );
}
