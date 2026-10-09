import { appConfig } from '@/shared/config/env';
import { cn } from '@/shared/lib/utils';

interface BrandLogoProps {
  name?: string;
  logoUrl?: string | null;
  className?: string;
  inverted?: boolean;
  compact?: boolean;
}

/** Product mark: organization logo when configured, otherwise a monogram of the app name. */
export function BrandLogo({ name = appConfig.name, logoUrl = '/logo.png', className, inverted, compact }: BrandLogoProps) {
  const monogram = appConfig.shortName.slice(0, 2).toUpperCase();
  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      {logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={logoUrl} alt="" className="h-8 w-8 rounded-lg object-contain" />
      ) : (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold tracking-tight text-brand-foreground shadow-sm">
          {monogram}
        </span>
      )}
      {!compact && (
        <span className={cn('truncate text-sm font-semibold tracking-tight', inverted ? 'text-white' : 'text-foreground')}>{name}</span>
      )}
    </div>
  );
}
