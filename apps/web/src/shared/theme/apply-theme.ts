import { contrastText } from '@/shared/lib/utils';
import { accentColor, type Appearance } from './theme.config';

export function resolveMode(mode: Appearance['mode']): 'light' | 'dark' {
  if (mode !== 'system') return mode;
  return typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

/** Writes the appearance onto <html> as data attributes / CSS variables. */
export function applyAppearance(appearance: Appearance): void {
  const root = document.documentElement;
  // Avoid every element transitioning while the palette swaps.
  root.classList.add('theme-transition-off');

  root.dataset.style = appearance.style;
  root.dataset.mode = resolveMode(appearance.mode);
  root.dataset.font = appearance.font;
  root.dataset.density = appearance.density;
  root.dataset.radius = appearance.radius;
  root.dataset.sidebar = appearance.sidebar;

  const accent = accentColor(appearance.accent);
  if (accent) {
    root.style.setProperty('--accent', accent);
    root.style.setProperty('--accent-foreground', contrastText(accent));
  } else {
    root.style.removeProperty('--accent');
    root.style.removeProperty('--accent-foreground');
  }

  requestAnimationFrame(() => root.classList.remove('theme-transition-off'));
}
