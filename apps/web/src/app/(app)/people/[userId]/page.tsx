import type { Metadata } from 'next';
import { PersonDetails } from '@/features/users/components/person-details';

export const metadata: Metadata = { title: 'Person' };

export default async function PersonPage({ params }: { params: Promise<{ userId: string }> }) {
  const { userId } = await params;
  return <PersonDetails userId={userId} />;
}
