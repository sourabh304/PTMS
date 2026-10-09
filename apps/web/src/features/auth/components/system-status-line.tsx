'use client';

import { useSystemStatus } from '@/shared/hooks/use-system-status';
import { cn } from '@/shared/lib/utils';

/** Live API status for public pages (uses the public health endpoint). */
export function SystemStatusLine() {
  const { operational, checking } = useSystemStatus();
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('size-1.5 rounded-full', checking ? 'bg-sidebar-muted' : operational ? 'bg-success' : 'bg-danger')} />
      {checking ? 'Checking status…' : operational ? 'All systems operational' : 'Service degraded'}
    </span>
  );
}
