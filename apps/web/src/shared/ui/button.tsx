import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/shared/lib/utils';

const variants = {
  primary: 'bg-brand text-brand-foreground shadow-clay-brand hover:-translate-y-px hover:brightness-110 active:translate-y-0 active:shadow-clay-inset',
  secondary: 'clay-sm text-foreground hover:-translate-y-px active:translate-y-0 active:shadow-clay-inset',
  ghost: 'text-foreground hover:bg-surface-muted hover:shadow-clay-inset',
  danger:
    'bg-danger text-white shadow-[6px_8px_16px_rgb(229_72_77/0.35),-4px_-4px_10px_rgb(255_251_242/0.85),inset_3px_3px_6px_rgb(255_251_242/0.3),inset_-3px_-4px_8px_rgb(0_0_0/0.18)] hover:-translate-y-px hover:brightness-110 active:translate-y-0',
  link: 'text-brand hover:underline px-0 h-auto',
} as const;

const sizes = {
  sm: 'h-8 px-3.5 text-xs gap-1.5',
  md: 'h-10 px-5 text-sm gap-2',
  lg: 'h-12 px-6 text-sm gap-2',
  icon: 'h-9 w-9 p-0 justify-center',
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
        'inline-flex shrink-0 items-center rounded-xl font-semibold transition duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {children}
    </button>
  ),
);
Button.displayName = 'Button';
