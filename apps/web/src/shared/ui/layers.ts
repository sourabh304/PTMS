'use client';

import { useLayoutEffect, useRef } from 'react';

/**
 * Stack of open overlays (modals, drawers, popovers). Escape and presses outside
 * only reach the topmost layer, so closing a picker inside a modal keeps the modal
 * open and a drawer opened from a modal closes on its own.
 */
export interface LayerOptions {
  /** Escape was pressed while this layer was on top. */
  onEscape: () => void;
  /** Whether a mouse press on `target` lands outside the layer (the backdrop, or anywhere but the panel). */
  isOutside: (target: Node) => boolean;
  onPressOutside: () => void;
  /**
   * Tab was pressed while this layer was on top. Return `false` when focus went back
   * to the layer below (e.g. a menu closing onto its trigger) so that layer sees the key too.
   */
  onTab?: (event: KeyboardEvent) => boolean | void;
}

type Layer = { current: LayerOptions };
const stack: Layer[] = [];

function onKeyDown(event: KeyboardEvent) {
  if (event.defaultPrevented || event.isComposing) return;
  if (event.key === 'Escape') {
    const top = stack.at(-1);
    if (!top) return;
    event.preventDefault();
    top.current.onEscape();
  } else if (event.key === 'Tab') {
    for (let index = stack.length - 1; index >= 0; index--) {
      if (stack[index].current.onTab?.(event) !== false) break;
    }
  }
}

function onMouseDown(event: MouseEvent) {
  const top = stack.at(-1);
  // Capture phase: a panel that stops propagation (modals do) cannot hide the press.
  if (top && event.target instanceof Node && top.current.isOutside(event.target)) top.current.onPressOutside();
}

/** Registers an overlay while `open`; the last one opened is on top. */
export function useLayer(open: boolean, options: LayerOptions) {
  const layer = useRef(options);
  layer.current = options;

  useLayoutEffect(() => {
    if (!open) return;
    stack.push(layer);
    if (stack.length === 1) {
      // Window, bubble phase: runs after React's handlers, which can claim a key with preventDefault.
      window.addEventListener('keydown', onKeyDown);
      document.addEventListener('mousedown', onMouseDown, true);
    }
    return () => {
      const index = stack.lastIndexOf(layer);
      if (index >= 0) stack.splice(index, 1);
      if (!stack.length) {
        window.removeEventListener('keydown', onKeyDown);
        document.removeEventListener('mousedown', onMouseDown, true);
      }
    };
  }, [open]);
}

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

/** The element itself when it can take focus, otherwise the first focusable element inside it. */
export function focusTarget(node: HTMLElement | null): HTMLElement | null {
  if (!node) return null;
  return node.matches(FOCUSABLE) ? node : node.querySelector<HTMLElement>(FOCUSABLE);
}

/** Visible, keyboard-reachable elements inside `root` in DOM order (one Tab stop per radio group). */
export function focusableIn(root: HTMLElement): HTMLElement[] {
  return [...root.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((element) => {
    if (element.tabIndex < 0 || element.closest('[inert]') || !element.getClientRects().length) return false;
    if (getComputedStyle(element).visibility === 'hidden') return false;
    if (element instanceof HTMLInputElement && element.type === 'radio' && element.name) {
      const group = [...root.querySelectorAll<HTMLInputElement>(`input[type="radio"][name="${CSS.escape(element.name)}"]`)];
      return element.checked || (!group.some((radio) => radio.checked) && group[0] === element);
    }
    return true;
  });
}
