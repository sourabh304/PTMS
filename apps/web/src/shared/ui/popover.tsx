'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import { focusableIn, focusTarget, useLayer } from './layers';

const GAP = 6;
const VIEWPORT_MARGIN = 8;
const MENU_KEYS = ['ArrowDown', 'ArrowUp', 'Home', 'End'];

interface PopoverProps {
  /** Renders the trigger; spread `ref` and call `toggle` from it. */
  trigger: (props: { ref: (node: HTMLElement | null) => void; open: boolean; toggle: () => void }) => ReactNode;
  children: (close: () => void) => ReactNode;
  align?: 'start' | 'center' | 'end';
  className?: string;
  /** Disables opening (read-only cells). */
  disabled?: boolean;
  /** `menu` for lists of actions: arrow keys move between items and Tab closes it. */
  role?: 'dialog' | 'menu';
  /** Accessible name of the panel. */
  label?: string;
  /** Makes the panel at least as wide as the trigger (pickers that stand in for a select). */
  matchTriggerWidth?: boolean;
}

interface Position {
  top: number;
  left: number;
  minWidth?: number;
}

/**
 * Floating panel rendered in a portal, so it is never clipped by scrolling tables.
 * Positions below the trigger (above when there is no room), follows it while
 * scrolling and closes on outside click or Escape (only the topmost layer, see useLayer).
 * Opening moves focus into the panel; closing from the keyboard or by picking an
 * item returns it to the trigger.
 */
export function Popover({ trigger, children, align = 'start', className, disabled, role = 'dialog', label, matchTriggerWidth }: PopoverProps) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  /** Menus also cover popovers filled with DropdownItems. */
  const isMenu = useCallback(() => role === 'menu' || !!panelRef.current?.querySelector('[role="menuitem"]'), [role]);

  /** Closes the panel; `returnFocus` moves focus back to the trigger first. */
  const dismiss = useCallback((returnFocus: boolean) => {
    if (returnFocus) focusTarget(triggerRef.current)?.focus({ preventScroll: true });
    setOpen(false);
    setPosition(null);
  }, []);

  /** Close handed to the content: after picking an item, focus goes back to the trigger instead of <body>. */
  const close = useCallback(() => {
    const active = document.activeElement;
    dismiss(!active || active === document.body || !!panelRef.current?.contains(active));
  }, [dismiss]);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((value) => !value);
  }, [disabled]);

  /** Places the panel below the trigger, or above it when there is no room. */
  const reposition = useCallback(() => {
    const panelNode = panelRef.current;
    if (!triggerRef.current || !panelNode) return;
    const anchor = triggerRef.current.getBoundingClientRect();
    const minWidth = matchTriggerWidth ? Math.min(anchor.width, window.innerWidth - VIEWPORT_MARGIN * 2) : undefined;
    // Apply the width before measuring, so the horizontal clamp uses the final size.
    if (minWidth !== undefined) panelNode.style.minWidth = `${minWidth}px`;
    const panel = panelNode.getBoundingClientRect();
    const fitsBelow = anchor.bottom + GAP + panel.height <= window.innerHeight - VIEWPORT_MARGIN;
    const top = fitsBelow ? anchor.bottom + GAP : Math.max(VIEWPORT_MARGIN, anchor.top - GAP - panel.height);
    const preferred = align === 'start' ? anchor.left : align === 'end' ? anchor.right - panel.width : anchor.left + (anchor.width - panel.width) / 2;
    const left = Math.min(Math.max(VIEWPORT_MARGIN, preferred), window.innerWidth - panel.width - VIEWPORT_MARGIN);
    setPosition({ top, left, minWidth });
  }, [align, matchTriggerWidth]);

  useLayoutEffect(() => {
    if (!open) return;
    reposition();
    const panel = panelRef.current;
    if (!panel || panel.contains(document.activeElement)) return;
    // Focus the first menu item, else the autoFocus/first control, else the panel itself.
    const items = focusableIn(panel);
    const menuItem = isMenu() ? items.find((item) => item.getAttribute('role') === 'menuitem') : undefined;
    (menuItem ?? panel.querySelector<HTMLElement>('[data-autofocus]') ?? items[0] ?? panel).focus({ preventScroll: true });
  }, [open, reposition, isMenu]);

  useLayoutEffect(() => {
    // Content swapped under the focused element (e.g. a sub-view of a menu): keep focus inside the panel.
    if (open && panelRef.current && document.activeElement === document.body) (focusableIn(panelRef.current)[0] ?? panelRef.current).focus({ preventScroll: true });
  });

  useEffect(() => {
    // Expose the state on the trigger's control (button), also for triggers that do not set it themselves.
    const control = focusTarget(triggerRef.current);
    control?.setAttribute('aria-haspopup', role);
    control?.setAttribute('aria-expanded', String(open));
  }, [open, role]);

  useLayer(open, {
    onEscape: () => dismiss(true),
    isOutside: (target) => !panelRef.current?.contains(target) && !triggerRef.current?.contains(target),
    onPressOutside: () => dismiss(false),
    onTab: (event) => {
      const panel = panelRef.current;
      if (!panel) return;
      if (isMenu()) {
        // Tab leaves a menu: close it and let focus move on from the trigger.
        dismiss(true);
        return false;
      }
      const items = focusableIn(panel);
      const active = document.activeElement;
      const leaving = !items.length || (event.shiftKey ? active === items[0] || active === panel : active === items.at(-1));
      if (!leaving) {
        if (!panel.contains(active)) {
          event.preventDefault();
          items[0].focus();
        }
        return;
      }
      // Tabbing past either end closes the panel: Shift+Tab lands on the trigger, Tab moves on from it.
      dismiss(true);
      if (event.shiftKey) event.preventDefault();
      return false;
    },
  });

  useEffect(() => {
    if (!open) return;
    // Follow the trigger while the page or a scrolling table moves underneath.
    window.addEventListener('scroll', reposition, true);
    window.addEventListener('resize', reposition);
    return () => {
      window.removeEventListener('scroll', reposition, true);
      window.removeEventListener('resize', reposition);
    };
  }, [open, reposition]);

  /** Arrow keys, Home and End move between the items of a menu. */
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    const panel = panelRef.current;
    if (!panel || !MENU_KEYS.includes(event.key) || !isMenu()) return;
    if ((event.target as HTMLElement).matches('input:not([type="checkbox"]):not([type="radio"]), textarea, select')) return;
    const items = focusableIn(panel);
    if (!items.length) return;
    event.preventDefault();
    event.stopPropagation();
    const index = items.indexOf(document.activeElement as HTMLElement);
    const last = items.length - 1;
    const next = { Home: 0, End: last, ArrowDown: index >= last ? 0 : index + 1, ArrowUp: index <= 0 ? last : index - 1 }[event.key] ?? 0;
    items[next].focus();
  };

  return (
    <>
      {trigger({
        ref: (node) => {
          triggerRef.current = node;
        },
        open,
        toggle,
      })}
      {open &&
        createPortal(
          <div
            ref={panelRef}
            role={role}
            aria-label={label}
            tabIndex={-1}
            onKeyDown={onKeyDown}
            // Transparent (not hidden) until placed, so autoFocus inside the panel still works.
            style={position ? { top: position.top, left: position.left, minWidth: position.minWidth } : { top: 0, left: 0, opacity: 0, pointerEvents: 'none' }}
            className={cn('fixed z-50 animate-pop-in rounded-ui-lg border border-border bg-surface p-2 shadow-ui-lg outline-none', className)}
          >
            {children(close)}
          </div>,
          document.body,
        )}
    </>
  );
}
