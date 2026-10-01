'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from './theme-provider';

/** Quick light/dark switch for the top bar; full options live in Settings → Appearance. */
export function ThemeToggle() {
  const { resolvedMode, update } = useTheme();
  const next = resolvedMode === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={() => update({ mode: next })}
      aria-label={`Switch to ${next} mode`}
      title={`Switch to ${next} mode`}
      className="flex size-9 items-center justify-center rounded-ui text-muted transition-colors hover:bg-surface-muted hover:text-foreground"
    >
      {resolvedMode === 'dark' ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
    </button>
  );
}
