'use client';

import { useCallback, useEffect, useState } from 'react';
import { NAV_STORAGE_KEY } from './theme.config';

/**
 * Desktop sidebar collapse state. The value lives on <html data-nav> (set before paint by
 * ThemeScript) so the layout never jumps; React state only mirrors it for labels/aria.
 * Keyboard shortcut: Ctrl/Cmd + B.
 */
export function useNavCollapsed() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => setCollapsed(document.documentElement.dataset.nav === 'collapsed'), []);

  const toggle = useCallback(() => {
    const next = document.documentElement.dataset.nav !== 'collapsed';
    document.documentElement.dataset.nav = next ? 'collapsed' : 'expanded';
    try {
      localStorage.setItem(NAV_STORAGE_KEY, next ? 'collapsed' : 'expanded');
    } catch {
      /* storage unavailable */
    }
    setCollapsed(next);
  }, []);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 'b') {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle]);

  return { collapsed, toggle };
}
