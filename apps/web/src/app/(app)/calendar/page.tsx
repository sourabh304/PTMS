import type { Metadata } from 'next';
import { Suspense } from 'react';
import { GlobalCalendar } from '@/features/calendar/components/global-calendar';
import { Spinner } from '@/shared/ui/feedback';

export const metadata: Metadata = { title: 'Calendar' };

export default function CalendarPage() {
  return (
    <Suspense fallback={<Spinner />}>
      <GlobalCalendar />
    </Suspense>
  );
}
