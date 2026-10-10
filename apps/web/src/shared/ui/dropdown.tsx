'use client';

import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';
import { Popover } from './popover';

interface DropdownProps {
  trigger: (props: { open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'left' | 'right';
  className?: string;
}

/**
 * Accessible menu that closes on outside click / Escape. Rendered in a portal (see Popover),
 * so scrolling tables and cards with hidden overflow never cut it off. Opening focuses the
 * first item; arrow keys move between items and Tab or Escape closes it.
 */
export function Dropdown({ trigger, children, align = 'right', className }: DropdownProps) {
  return (
    <Popover
      role="menu"
      align={align === 'right' ? 'end' : 'start'}
      className={cn('min-w-52 max-w-[calc(100vw-1.5rem)] overflow-hidden p-1', className)}
      trigger={({ ref, open, toggle }) => (
        <span ref={ref} className="inline-flex">
          {trigger({ open, toggle })}
        </span>
      )}
    >
      {children}
    </Popover>
  );
}

export function DropdownItem({ onClick, children, danger }: { onClick: () => void; children: ReactNode; danger?: boolean }) {
  return (
    <button
      type="button"
      role="menuitem"
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-2.5 rounded-[calc(var(--radius)-2px)] px-2.5 py-2 text-left text-sm outline-none transition-colors [&_svg]:size-4 [&_svg]:text-muted',
        danger
          ? 'text-danger hover:bg-danger-soft focus-visible:bg-danger-soft [&_svg]:text-danger'
          : 'text-foreground-soft hover:bg-surface-muted hover:text-foreground focus-visible:bg-surface-muted focus-visible:text-foreground',
      )}
    >
      {children}
    </button>
  );
}

export function DropdownSeparator() {
  return <div role="separator" className="-mx-1 my-1 h-px bg-border" />;
}
