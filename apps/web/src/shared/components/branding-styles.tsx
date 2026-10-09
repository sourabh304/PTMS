import { appConfig } from '@/shared/config/env';
import { contrastText } from '@/shared/lib/utils';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/**
 * Publishes the organization brand color (or the env default) as `--org-brand`.
 * A personal accent chosen in Settings → Appearance takes precedence (see globals.css).
 */
export function BrandingStyles({ color }: { color?: string | null }) {
  const brand = color && HEX.test(color) ? color : appConfig.brandColor;
  if (!HEX.test(brand)) return null;
  return <style>{`:root{--org-brand:${brand};--org-brand-foreground:${contrastText(brand)};}`}</style>;
}
