'use client';

import { ErrorState } from '@/shared/ui/feedback';

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <ErrorState message={error.message || 'An unexpected error occurred.'} onRetry={reset} />
    </div>
  );
}
