import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const tones = {
  neutral: 'bg-surface-muted text-foreground/80',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-emerald-100/80 text-emerald-700',
  warning: 'bg-amber-100/80 text-amber-700',
  danger: 'bg-rose-100/80 text-rose-700',
} as const;

interface BadgeProps {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-[inset_1px_1px_2px_rgb(255_251_242/0.8),inset_-1px_-1px_2px_rgb(0_0_0/0.06)]', tones[tone], className)}>
      {children}
    </span>
  );
}

interface ColorBadgeProps {
  color: string;
  label: ReactNode;
  className?: string;
  /** Solid dot + label instead of tinted pill. */
  variant?: 'pill' | 'dot';
}

/** Badge colored by a configurable lookup color (status, priority, severity…). */
export function ColorBadge({ color, label, className, variant = 'pill' }: ColorBadgeProps) {
  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium text-foreground/80', className)}>
        <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex max-w-full items-center truncate rounded-full px-2.5 py-0.5 text-xs font-semibold shadow-[inset_1px_1px_2px_rgb(255_251_242/0.8),inset_-1px_-1px_2px_rgb(0_0_0/0.06)]', className)}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 16%, var(--surface))`, color }}
    >
      {label}
    </span>
  );
}
