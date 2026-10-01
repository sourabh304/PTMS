'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  breadcrumb?: ReactNode;
}

export function PageHeader({ title, description, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div className="min-w-0">
        {breadcrumb && <div className="mb-1 text-xs text-muted">{breadcrumb}</div>}
        <h1 className="truncate text-xl font-semibold tracking-tight">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export interface TabItem {
  href: string;
  label: string;
  icon?: ReactNode;
  /** Match the href exactly instead of by prefix. */
  exact?: boolean;
}

export function LinkTabs({ items, className }: { items: TabItem[]; className?: string }) {
  const pathname = usePathname();
  return (
    <nav className={cn('scrollbar-thin -mb-px flex gap-1 overflow-x-auto border-b border-border', className)}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium transition',
              active ? 'border-brand text-brand' : 'border-transparent text-muted hover:text-foreground',
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

interface SegmentedProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: { value: T; label: ReactNode }[];
}

export function Segmented<T extends string>({ value, onChange, options }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-surface p-0.5 shadow-xs">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-md px-3 py-1 text-xs font-medium transition',
            option.value === value ? 'bg-brand text-brand-foreground' : 'text-muted hover:text-foreground',
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}

export function ProgressBar({ value, color, className }: { value: number; color?: string; className?: string }) {
  const safe = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className={cn('h-1.5 w-full overflow-hidden rounded-full bg-surface-muted', className)} role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${safe}%`, ...(color ? { backgroundColor: color } : {}) }} />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: ReactNode;
  hint?: ReactNode;
  tone?: 'brand' | 'danger' | 'success' | 'warning';
}

const statTones = {
  brand: 'bg-brand-soft text-brand',
  danger: 'bg-red-50 text-danger',
  success: 'bg-green-50 text-success',
  warning: 'bg-amber-50 text-warning',
} as const;

export function StatCard({ label, value, icon, hint, tone = 'brand' }: StatCardProps) {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      {icon && <div className={cn('flex h-11 w-11 shrink-0 items-center justify-center rounded-lg', statTones[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <p className="text-2xl font-semibold leading-tight">{value}</p>
        {hint && <p className="truncate text-xs text-muted">{hint}</p>}
      </div>
    </div>
  );
}

interface PaginationProps {
  page: number;
  totalPages: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, total, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3 text-xs text-muted">
      <span>
        Page {page} of {totalPages} · {total} items
      </span>
      <div className="flex gap-2">
        <button className="rounded-md border border-border px-2.5 py-1 hover:bg-surface-muted disabled:opacity-50" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button className="rounded-md border border-border px-2.5 py-1 hover:bg-surface-muted disabled:opacity-50" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
