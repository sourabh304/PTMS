'use client';

import { MoreHorizontal } from 'lucide-react';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Popover } from '@/shared/ui/popover';

/**
 * "⋯" overflow menu for table rows and list items. Rendered in a portal, so it
 * is never clipped by a horizontally scrolling table. Fill it with DropdownItem.
 */
export function RowMenu({ label = 'More actions', children, className }: { label?: string; children: (close: () => void) => ReactNode; className?: string }) {
  return (
    <Popover
      align="end"
      className="min-w-48 p-1"
      trigger={({ ref, open, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            toggle();
          }}
          aria-label={label}
          title={label}
          aria-expanded={open}
          className={cn(
            'inline-flex size-8 items-center justify-center rounded-ui text-muted transition-colors hover:bg-surface-muted hover:text-foreground',
            open && 'bg-surface-muted text-foreground',
            className,
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      )}
    >
      {(close) => <div role="menu">{children(close)}</div>}
    </Popover>
  );
}
