'use client';

import { useEffect, useRef, useState } from 'react';
import { appConfig } from '@/shared/config/env';
import { cn } from '@/shared/lib/utils';

interface BrandLogoProps {
  name?: string;
  logoUrl?: string | null;
  className?: string;
  /** Hide the name next to the logo image (the monogram fallback always shows it). */
  compact?: boolean;
  size?: 'md' | 'lg';
}

const sizes = { md: 'h-11 max-w-[150px]', lg: 'h-16 max-w-[220px]' } as const;

/**
 * Product mark: organization logo, else the default SegueIT logo, sitting on a clay
 * tile. Falls back to a monogram when the image is missing or fails to load.
 */
export function BrandLogo({ name = appConfig.name, logoUrl, className, compact, size = 'md' }: BrandLogoProps) {
  const src = logoUrl || appConfig.logoUrl;
  const [failed, setFailed] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // A server-rendered <img> can fail before hydration attaches onError, so re-check on mount.
  useEffect(() => {
    const img = imgRef.current;
    setFailed(Boolean(img && img.complete && img.naturalWidth === 0));
  }, [src]);

  const showImage = Boolean(src) && !failed;
  const monogram = appConfig.shortName.slice(0, 2).toUpperCase();
  return (
    <div className={cn('flex min-w-0 items-center gap-3', className)}>
      {showImage ? (
        <span className={cn('clay-sm flex shrink-0 items-center justify-center rounded-2xl px-2.5 py-1.5', sizes[size])}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img ref={imgRef} src={src} alt={`${name} logo`} className="h-full w-auto object-contain" onError={() => setFailed(true)} />
        </span>
      ) : (
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-brand text-xs font-extrabold tracking-tight text-brand-foreground shadow-clay-brand">
          {monogram}
        </span>
      )}
      {!(compact && showImage) && <span className="truncate text-sm font-bold tracking-tight text-foreground">{name}</span>}
    </div>
  );
}
