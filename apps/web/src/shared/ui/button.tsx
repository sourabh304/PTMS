import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const variants = {
  primary: 'bg-brand text-brand-foreground shadow-ui-sm hover:bg-[color-mix(in_srgb,var(--brand)_88%,black)]',
  secondary: 'border border-border bg-surface text-foreground shadow-ui-sm hover:bg-surface-hover hover:border-border-strong',
  ghost: 'text-foreground-soft hover:bg-surface-muted hover:text-foreground',
  danger: 'bg-danger text-white shadow-ui-sm hover:bg-[color-mix(in_srgb,var(--danger)_88%,black)]',
  'danger-ghost': 'text-danger hover:bg-danger-soft',
  link: 'h-auto px-0 text-brand hover:underline underline-offset-4',
} as const;

const sizes = {
  sm: 'h-8 px-3 text-xs gap-1.5 [&_svg]:size-3.5',
  md: 'h-[var(--control-h)] px-3.5 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
  icon: 'h-8 w-8 justify-center p-0',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading, disabled, children, type = 'button', ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || loading}
      className={cn(
        'inline-flex shrink-0 select-none items-center whitespace-nowrap rounded-ui font-medium transition-colors duration-150 disabled:pointer-events-none disabled:opacity-50 [&_svg]:size-4 [&_svg]:shrink-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
