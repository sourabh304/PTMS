'use client';

import { ChevronDown, SlidersHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Popover } from '@/shared/ui/popover';

interface FilterPopoverProps {
  /** Short text on the button, e.g. "Last 30 days · All projects". */
  summary?: ReactNode;
  /** Number of filters that differ from their defaults; shown as a badge. */
  activeCount?: number;
  /** Clears every filter; adds a "Reset" link to the panel when given. */
  onReset?: () => void;
  align?: 'start' | 'center' | 'end';
  label?: string;
  children: ReactNode;
}

/** Button that opens a small card holding a page's secondary filters. */
export function FilterPopover({ summary, activeCount = 0, onReset, align = 'start', label = 'Filters', children }: FilterPopoverProps) {
  return (
    <Popover
      align={align}
      className="w-[min(20rem,calc(100vw-1rem))] p-0"
      trigger={({ ref, open, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          aria-expanded={open}
          className={cn(
            'inline-flex h-[var(--control-h)] min-w-0 max-w-full items-center gap-2 rounded-ui border bg-surface px-3 text-sm shadow-ui-sm transition-colors hover:border-border-strong',
            open || activeCount ? 'border-brand/40 text-foreground' : 'border-border text-foreground-soft',
          )}
        >
          <SlidersHorizontal className="size-4 shrink-0 text-muted" />
          <span className="font-medium">{label}</span>
          {summary && <span className="hidden min-w-0 truncate text-muted sm:inline">· {summary}</span>}
          {activeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-foreground">{activeCount}</span>
          )}
          <ChevronDown className={cn('size-3.5 shrink-0 text-muted transition-transform', open && 'rotate-180')} />
        </button>
      )}
    >
      {() => (
        <div>
          <div className="flex items-center justify-between border-b border-border px-3.5 py-2.5">
            <span className="text-sm font-semibold text-foreground">{label}</span>
            {onReset && activeCount > 0 && (
              <button type="button" onClick={onReset} className="text-xs font-medium text-brand hover:underline">
                Reset
              </button>
            )}
          </div>
          <div className="space-y-3 p-3.5">{children}</div>
        </div>
      )}
    </Popover>
  );
}
