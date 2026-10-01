import { appConfig } from '@/shared/config/env';
import { contrastText } from '@/shared/lib/utils';

const HEX = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** Applies the organization's brand color (or the env default) to the design tokens. */
export function BrandingStyles({ color }: { color?: string | null }) {
  const brand = color && HEX.test(color) ? color : appConfig.brandColor;
  if (!HEX.test(brand)) return null;
  return <style>{`:root{--brand:${brand};--brand-foreground:${contrastText(brand)};}`}</style>;
}
