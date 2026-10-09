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
        <h1 className="truncate text-2xl font-extrabold tracking-tight">{title}</h1>
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
    <nav className={cn('clay-inset scrollbar-thin flex w-fit max-w-full gap-1 overflow-x-auto rounded-2xl p-1.5', className)}>
      {items.map((item) => {
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              'inline-flex shrink-0 items-center gap-1.5 rounded-xl px-3.5 py-2 text-sm font-semibold transition',
              active ? 'clay-sm text-brand' : 'text-muted hover:text-foreground',
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
    <div className="clay-inset inline-flex rounded-xl p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            'rounded-lg px-3 py-1.5 text-xs font-semibold transition',
            option.value === value ? 'bg-brand text-brand-foreground shadow-clay-brand' : 'text-muted hover:text-foreground',
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
    <div className={cn('clay-inset h-2 w-full overflow-hidden rounded-full', className)} role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
      <div className="h-full rounded-full bg-brand shadow-[inset_1px_1px_2px_rgb(255_251_242/0.45)] transition-all" style={{ width: `${safe}%`, ...(color ? { backgroundColor: color } : {}) }} />
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
  brand: 'bg-brand text-brand-foreground shadow-clay-brand',
  danger: 'bg-rose-400 text-white shadow-[5px_6px_12px_rgb(244_63_94/0.3),inset_2px_2px_4px_rgb(255_251_242/0.35),inset_-2px_-3px_6px_rgb(0_0_0/0.15)]',
  success: 'bg-emerald-400 text-white shadow-[5px_6px_12px_rgb(16_185_129/0.3),inset_2px_2px_4px_rgb(255_251_242/0.35),inset_-2px_-3px_6px_rgb(0_0_0/0.15)]',
  warning: 'bg-amber-400 text-white shadow-[5px_6px_12px_rgb(245_158_11/0.3),inset_2px_2px_4px_rgb(255_251_242/0.35),inset_-2px_-3px_6px_rgb(0_0_0/0.15)]',
} as const;

export function StatCard({ label, value, icon, hint, tone = 'brand' }: StatCardProps) {
  return (
    <div className="clay flex items-center gap-4 rounded-3xl p-5 transition hover:-translate-y-0.5">
      {icon && <div className={cn('flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl', statTones[tone])}>{icon}</div>}
      <div className="min-w-0">
        <p className="truncate text-[11px] font-bold uppercase tracking-wider text-muted">{label}</p>
        <p className="text-2xl font-extrabold leading-tight">{value}</p>
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
    <div className="flex items-center justify-between border-t border-border/70 px-4 py-3 text-xs text-muted">
      <span>
        Page {page} of {totalPages} · {total} items
      </span>
      <div className="flex gap-2">
        <button className="clay-sm rounded-xl px-3 py-1.5 font-semibold transition hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          Previous
        </button>
        <button className="clay-sm rounded-xl px-3 py-1.5 font-semibold transition hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
