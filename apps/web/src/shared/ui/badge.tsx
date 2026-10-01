import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const tones = {
  neutral: 'bg-surface-muted text-foreground/80',
  brand: 'bg-brand-soft text-brand',
  success: 'bg-green-50 text-green-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
} as const;

interface BadgeProps {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium', tones[tone], className)}>
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
      className={cn('inline-flex max-w-full items-center truncate rounded-md px-2 py-0.5 text-xs font-medium', className)}
      style={{ backgroundColor: `color-mix(in srgb, ${color} 14%, white)`, color }}
    >
      {label}
    </span>
  );
}
