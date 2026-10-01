import { appConfig } from '@/shared/config/env';
import { cn } from '@/shared/lib/utils';

/** Text-only product name (no logo by design). */
export function Wordmark({ className }: { className?: string }) {
  return <span className={cn('truncate text-[15px] font-semibold tracking-tight', className)}>{appConfig.name}</span>;
}
