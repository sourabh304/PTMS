import type { ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

const tones = {
  neutral: 'bg-surface-muted text-foreground-soft ring-border',
  brand: 'bg-brand-soft text-brand ring-brand/20',
  success: 'bg-success-soft text-success ring-success/20',
  warning: 'bg-warning-soft text-warning ring-warning/20',
  danger: 'bg-danger-soft text-danger ring-danger/20',
} as const;

interface BadgeProps {
  children: ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}

export function Badge({ children, tone = 'neutral', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium ring-1 ring-inset [&_svg]:size-3',
        tones[tone],
        className,
      )}
    >
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

/** Badge colored by a configurable lookup color (status, priority, severity…); adapts to dark mode. */
export function ColorBadge({ color, label, className, variant = 'pill' }: ColorBadgeProps) {
  if (variant === 'dot') {
    return (
      <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap text-xs font-medium text-foreground-soft', className)}>
        <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: color }} />
        {label}
      </span>
    );
  }
  return (
    <span
      className={cn('inline-flex max-w-full items-center gap-1.5 truncate whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium', className)}
      style={{
        backgroundColor: `color-mix(in srgb, ${color} 13%, var(--surface))`,
        color: `color-mix(in srgb, ${color} 82%, var(--foreground))`,
        boxShadow: `inset 0 0 0 1px color-mix(in srgb, ${color} 22%, transparent)`,
      }}
    >
      <span className="size-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {label}
    </span>
  );
}
