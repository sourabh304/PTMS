import type { Metadata } from 'next';
import { ProfileView } from '@/features/users/components/profile-view';

export const metadata: Metadata = { title: 'My profile' };

export default function PlatformProfilePage() {
  return <ProfileView />;
}
