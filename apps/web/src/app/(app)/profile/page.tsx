import type { Metadata } from 'next';
import { Suspense } from 'react';
import { ProfileView } from '@/features/users/components/profile-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'My profile' };

export default function ProfilePage() {
  return (
    <Suspense fallback={<Spinner />}>
      <ProfileView />
    </Suspense>
  );
}
