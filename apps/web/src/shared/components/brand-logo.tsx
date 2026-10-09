import { appConfig } from '@/shared/config/env';
import { cn } from '@/shared/lib/utils';

interface BrandLogoProps {
  /** Text shown next to the logo; defaults to the product name. */
  name?: string;
  /** Logo image; defaults to the configured logo. `null` shows a monogram instead. */
  logoUrl?: string | null;
  className?: string;
  /** The logo sits on a dark surface: use the dark-background variant and light text. */
  inverted?: boolean;
  /** Logo only, without the name. */
  compact?: boolean;
}

/**
 * Brand mark: the company logo with the product name. On regular surfaces both the light
 * and dark logo variants are rendered and globals.css shows the one matching the theme.
 */
export function BrandLogo({ name = appConfig.name, logoUrl = appConfig.logoUrl, className, inverted, compact }: BrandLogoProps) {
  const imageClass = 'h-7 w-auto max-w-[8rem] shrink-0 object-contain';
  // The dark variant only exists for the product's own logo, not for a custom one.
  const hasDarkVariant = logoUrl === appConfig.logoUrl;
  return (
    <div className={cn('flex min-w-0 items-center gap-2.5', className)}>
      {logoUrl === null ? (
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-brand text-xs font-bold tracking-tight text-brand-foreground shadow-sm">
          {name.slice(0, 2).toUpperCase()}
        </span>
      ) : !hasDarkVariant || inverted ? (
        // eslint-disable-next-line @next/next/no-img-element -- static brand asset
        <img src={hasDarkVariant ? appConfig.logoDarkUrl : logoUrl} alt={appConfig.companyName} className={imageClass} />
      ) : (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoUrl} alt={appConfig.companyName} className={cn('brand-logo-light', imageClass)} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={appConfig.logoDarkUrl} alt={appConfig.companyName} className={cn('brand-logo-dark', imageClass)} />
        </>
      )}
      {!compact && <span className={cn('truncate text-sm font-semibold tracking-tight', inverted && 'text-white')}>{name}</span>}
    </div>
  );
}
