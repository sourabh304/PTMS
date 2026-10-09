import { appConfig } from '@/shared/config/env';
import { cn } from '@/shared/lib/utils';

interface BrandLogoProps {
  className?: string;
  /** `inline` puts the product name beside the logo; `stacked` puts it underneath (narrow spaces). */
  layout?: 'inline' | 'stacked';
}

/**
 * Company logo with the product name. Both a light and a dark-background variant are
 * rendered; CSS in globals.css shows the one that matches the surface behind it.
 */
export function BrandLogo({ className, layout = 'inline' }: BrandLogoProps) {
  const stacked = layout === 'stacked';
  return (
    <span className={cn('flex min-w-0', stacked ? 'flex-col items-start gap-1' : 'items-center gap-2.5', className)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- static brand asset, sized by height */}
      <img src={appConfig.logoUrl} alt={appConfig.companyName} className="brand-logo-light h-6 w-auto shrink-0" />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={appConfig.logoDarkUrl} alt={appConfig.companyName} className="brand-logo-dark h-6 w-auto shrink-0" />
      <span
        className={cn(
          'truncate font-semibold tracking-tight',
          stacked ? 'text-[11px] uppercase leading-none tracking-wider opacity-70' : 'border-l border-current/15 pl-2.5 text-[13px] leading-none opacity-90',
        )}
      >
        {appConfig.name}
      </span>
    </span>
  );
}
