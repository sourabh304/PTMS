'use client';

import { ChevronDown } from 'lucide-react';
import { useEffect, useId, useState, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const STORAGE_PREFIX = 'ui.collapsed.';

/**
 * Open/closed state that survives reloads when `storageKey` is given (stored per browser).
 * Falls back to `defaultOpen` when storage is unavailable.
 */
export function useCollapsed(storageKey: string | undefined, defaultOpen: boolean) {
  const [open, setOpen] = useState(defaultOpen);
  useEffect(() => {
    if (!storageKey) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_PREFIX + storageKey);
      if (saved !== null) setOpen(saved === 'open');
    } catch {
      // Storage blocked: keep the default.
    }
  }, [storageKey]);
  const toggle = () =>
    setOpen((value) => {
      const next = !value;
      if (storageKey) {
        try {
          window.localStorage.setItem(STORAGE_PREFIX + storageKey, next ? 'open' : 'closed');
        } catch {
          // Storage blocked: the state still changes for this visit.
        }
      }
      return next;
    });
  return [open, toggle] as const;
}

interface CollapsibleCardProps {
  title: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  /** Shown next to the title, e.g. a count. */
  meta?: ReactNode;
  /** Buttons on the right of the header; clicks on them never toggle the panel. */
  actions?: ReactNode;
  defaultOpen?: boolean;
  /** Remembers the open/closed state in this browser. */
  storageKey?: string;
  className?: string;
  bodyClassName?: string;
  children: ReactNode;
}

/** Card whose body folds away behind its header, keeping long pages short. */
export function CollapsibleCard({ title, description, icon, meta, actions, defaultOpen = true, storageKey, className, bodyClassName, children }: CollapsibleCardProps) {
  const [open, toggle] = useCollapsed(storageKey, defaultOpen);
  const id = useId();
  return (
    <section className={cn('rounded-ui-lg border border-border bg-surface shadow-ui-sm', className)}>
      <div className={cn('flex items-center gap-2 px-[var(--card-p)] py-3', open && 'border-b border-border')}>
        <button
          type="button"
          onClick={toggle}
          aria-expanded={open}
          aria-controls={id}
          className="group flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <ChevronDown className={cn('size-4 shrink-0 text-muted transition-transform', !open && '-rotate-90')} aria-hidden />
          {icon && <span className="text-muted [&_svg]:size-4">{icon}</span>}
          <span className="min-w-0">
            <span className="flex items-center gap-2">
              <span className="truncate text-sm font-semibold text-foreground">{title}</span>
              {meta && <span className="shrink-0 text-xs text-muted">{meta}</span>}
            </span>
            {description && open && <span className="block truncate text-xs text-muted">{description}</span>}
          </span>
        </button>
        {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
      </div>
      {open && (
        <div id={id} className={bodyClassName}>
          {children}
        </div>
      )}
    </section>
  );
}

/** Lightweight "show more" disclosure for secondary content inside a page or card. */
export function Disclosure({ label, defaultOpen = false, storageKey, children, className }: { label: ReactNode; defaultOpen?: boolean; storageKey?: string; children: ReactNode; className?: string }) {
  const [open, toggle] = useCollapsed(storageKey, defaultOpen);
  return (
    <div className={className}>
      <button type="button" onClick={toggle} aria-expanded={open} className="inline-flex items-center gap-1.5 text-xs font-medium text-muted hover:text-foreground">
        <ChevronDown className={cn('size-3.5 transition-transform', !open && '-rotate-90')} aria-hidden />
        {label}
      </button>
      {open && <div className="mt-3">{children}</div>}
    </div>
  );
}
