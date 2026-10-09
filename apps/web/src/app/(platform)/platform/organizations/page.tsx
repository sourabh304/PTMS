import type { Metadata } from 'next';
import { Suspense } from 'react';
import { OrganizationsView } from '@/features/platform/components/organizations-view';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Organizations' };

export default function PlatformOrganizationsPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <OrganizationsView />
    </Suspense>
  );
}
