'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { applyAppearance, resolveMode } from './apply-theme';
import { DEFAULT_APPEARANCE, sanitizeAppearance, THEME_STORAGE_KEY, type Appearance } from './theme.config';

interface ThemeContextValue {
  appearance: Appearance;
  /** The concrete mode in effect (system resolved). */
  resolvedMode: 'light' | 'dark';
  update: (patch: Partial<Appearance>) => void;
  reset: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStored(): Appearance {
  try {
    return sanitizeAppearance(JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) ?? '{}'));
  } catch {
    return DEFAULT_APPEARANCE;
  }
}

function persist(appearance: Appearance): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(appearance));
  } catch {
    /* storage unavailable (private mode) - keep in memory only */
  }
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // `null` until hydrated from storage; the pre-paint script has already applied it visually.
  const [stored, setAppearance] = useState<Appearance | null>(null);
  const [resolvedMode, setResolvedMode] = useState<'light' | 'dark'>('light');
  const appearance = stored ?? DEFAULT_APPEARANCE;

  useEffect(() => setAppearance(readStored()), []);

  useEffect(() => {
    if (!stored) return;
    applyAppearance(appearance);
    setResolvedMode(resolveMode(appearance.mode));
    if (appearance.mode !== 'system') return;
    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      applyAppearance(appearance);
      setResolvedMode(resolveMode('system'));
    };
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
  }, [stored]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keep multiple tabs in sync.
  useEffect(() => {
    const onStorage = (event: StorageEvent) => event.key === THEME_STORAGE_KEY && setAppearance(readStored());
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const update = useCallback((patch: Partial<Appearance>) => {
    setAppearance((current) => {
      const next = sanitizeAppearance({ ...(current ?? readStored()), ...patch });
      persist(next);
      return next;
    });
  }, []);

  const reset = useCallback(() => {
    persist(DEFAULT_APPEARANCE);
    setAppearance(DEFAULT_APPEARANCE);
  }, []);

  const value = useMemo(() => ({ appearance, resolvedMode, update, reset }), [appearance, resolvedMode, update, reset]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside <ThemeProvider>');
  return context;
}
