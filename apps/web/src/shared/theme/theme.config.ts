/**
 * Appearance options a user can personalize (stored per browser).
 * Adding an option here automatically surfaces it in Settings → Appearance.
 */
export const THEME_STORAGE_KEY = 'pt-appearance';
/** Desktop sidebar collapsed/expanded preference. */
export const NAV_STORAGE_KEY = 'pt-nav';

export const THEME_MODES = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
] as const;

/** `organization` keeps the color configured by the organization admin. */
export const ACCENT_PRESETS = [
  { value: 'organization', label: 'Organization', color: null },
  { value: 'blue', label: 'Blue', color: '#2563eb' },
  { value: 'indigo', label: 'Indigo', color: '#4f46e5' },
  { value: 'violet', label: 'Violet', color: '#7c3aed' },
  { value: 'teal', label: 'Teal', color: '#0d9488' },
  { value: 'emerald', label: 'Emerald', color: '#059669' },
  { value: 'amber', label: 'Amber', color: '#d97706' },
  { value: 'rose', label: 'Rose', color: '#e11d48' },
  { value: 'slate', label: 'Graphite', color: '#475467' },
] as const;

export const FONT_OPTIONS = [
  { value: 'figtree', label: 'Figtree', description: 'Friendly, clean and open' },
  { value: 'inter', label: 'Inter', description: 'Neutral and highly legible' },
  { value: 'geist', label: 'Geist', description: 'Crisp, modern grotesk' },
  { value: 'plex', label: 'IBM Plex Sans', description: 'Technical, corporate tone' },
  { value: 'manrope', label: 'Manrope', description: 'Friendly geometric shapes' },
] as const;

export const DENSITY_OPTIONS = [
  { value: 'comfortable', label: 'Comfortable' },
  { value: 'compact', label: 'Compact' },
] as const;

export const RADIUS_OPTIONS = [
  { value: 'sharp', label: 'Sharp' },
  { value: 'default', label: 'Default' },
  { value: 'rounded', label: 'Rounded' },
] as const;

export const SIDEBAR_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
] as const;

export type ThemeMode = (typeof THEME_MODES)[number]['value'];
export type AccentPreset = (typeof ACCENT_PRESETS)[number]['value'];
export type FontOption = (typeof FONT_OPTIONS)[number]['value'];
export type Density = (typeof DENSITY_OPTIONS)[number]['value'];
export type Radius = (typeof RADIUS_OPTIONS)[number]['value'];
export type SidebarStyle = (typeof SIDEBAR_OPTIONS)[number]['value'];

export interface Appearance {
  mode: ThemeMode;
  accent: AccentPreset;
  font: FontOption;
  density: Density;
  radius: Radius;
  sidebar: SidebarStyle;
}

export const DEFAULT_APPEARANCE: Appearance = {
  mode: 'system',
  accent: 'organization',
  font: 'figtree',
  density: 'comfortable',
  radius: 'default',
  sidebar: 'light',
};

const ALLOWED: { [K in keyof Appearance]: readonly string[] } = {
  mode: THEME_MODES.map((o) => o.value),
  accent: ACCENT_PRESETS.map((o) => o.value),
  font: FONT_OPTIONS.map((o) => o.value),
  density: DENSITY_OPTIONS.map((o) => o.value),
  radius: RADIUS_OPTIONS.map((o) => o.value),
  sidebar: SIDEBAR_OPTIONS.map((o) => o.value),
};

/** Merges stored values over the defaults, discarding anything unknown. */
export function sanitizeAppearance(raw: unknown): Appearance {
  const input = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const result = { ...DEFAULT_APPEARANCE };
  (Object.keys(ALLOWED) as (keyof Appearance)[]).forEach((key) => {
    const value = input[key];
    if (typeof value === 'string' && ALLOWED[key].includes(value)) {
      (result as Record<string, string>)[key] = value;
    }
  });
  return result;
}

export const accentColor = (accent: AccentPreset): string | null =>
  ACCENT_PRESETS.find((preset) => preset.value === accent)?.color ?? null;
