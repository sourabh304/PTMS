'use client';

import { X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/shared/lib/utils';
import { Button } from './button';
import { focusableIn, useLayer } from './layers';

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * Shared modal/drawer behavior: Escape and backdrop presses close only the topmost
 * layer (see useLayer), Tab stays inside the panel, the page behind does not scroll,
 * and focus returns to whatever opened the overlay.
 * `initialFocus` is the element focused on open when nothing inside asked for focus.
 */
function useOverlayBehavior(onClose: () => void, initialFocus: (panel: HTMLElement) => HTMLElement) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const initialFocusRef = useRef(initialFocus);
  // Read on the first render: a child's autoFocus moves focus before any effect runs.
  const [opener] = useState(() => document.activeElement as HTMLElement | null);
  /** Element focused on open, kept so a remount (Strict Mode) focuses it again. */
  const focusedOnOpen = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const panel = panelRef.current;
    if (panel) {
      // Keep a child's autoFocus; otherwise focus the preferred element.
      const target = panel.contains(document.activeElement) ? (document.activeElement as HTMLElement) : (focusedOnOpen.current ?? initialFocusRef.current(panel));
      focusedOnOpen.current = target;
      target.focus();
    }
    return () => {
      document.body.style.overflow = overflow;
      if (opener?.isConnected) opener.focus();
    };
  }, [opener]);

  useLayer(true, {
    onEscape: () => onCloseRef.current(),
    isOutside: (target) => target === backdropRef.current,
    onPressOutside: () => onCloseRef.current(),
    onTab: (event) => {
      const panel = panelRef.current;
      if (!panel || event.defaultPrevented) return;
      const items = focusableIn(panel);
      const active = document.activeElement;
      const first = items[0] ?? panel;
      const last = items.at(-1) ?? panel;
      // Wrap around at either end and pull stray focus back in, so Tab never reaches the page behind.
      if (!panel.contains(active) || (event.shiftKey ? active === first || active === panel : active === last)) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    },
  });
  return { backdropRef, panelRef };
}

/** Modals start in their first field or button (Cancel in a confirmation), skipping the header's close button. */
const firstControl = (panel: HTMLElement) => focusableIn(panel).find((element) => !element.hasAttribute('data-overlay-close')) ?? panel;
/** Drawers start on the panel: their first control is usually an inline-edited title. */
const panelItself = (panel: HTMLElement) => panel;

function OverlayHeader({ id, title, description, onClose }: { id: string; title: ReactNode; description?: ReactNode; onClose: () => void }) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-border px-5 py-4 sm:px-6">
      <div className="min-w-0">
        <h2 id={id} className="truncate text-base font-semibold tracking-tight">
          {title}
        </h2>
        {description && <div className="mt-0.5 text-sm text-muted">{description}</div>}
      </div>
      <Button variant="ghost" size="icon" onClick={onClose} aria-label="Close" data-overlay-close className="-mr-1.5 -mt-0.5">
        <X />
      </Button>
    </div>
  );
}

const sizes = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-2xl', xl: 'sm:max-w-4xl' } as const;

type ModalProps = OverlayProps & { size?: keyof typeof sizes };

export function Modal(props: ModalProps) {
  if (!props.open || typeof document === 'undefined') return null;
  return <ModalPanel {...props} />;
}

function ModalPanel({ onClose, title, description, children, footer, className, size = 'md' }: ModalProps) {
  const { backdropRef, panelRef } = useOverlayBehavior(onClose, firstControl);
  const titleId = useId();

  return createPortal(
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex animate-fade-in items-end justify-center overflow-y-auto bg-overlay backdrop-blur-[1px] sm:items-start sm:p-4 sm:pt-[10vh]"
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        // Portal events still bubble through the React tree; keep presses inside from reaching the opener's handlers.
        onMouseDown={(event) => event.stopPropagation()}
        className={cn(
          'flex max-h-[92dvh] w-full animate-pop-in flex-col rounded-t-ui-lg border border-border bg-surface shadow-ui-lg outline-none sm:max-h-[85vh] sm:rounded-ui-lg',
          sizes[size],
          className,
        )}
      >
        <OverlayHeader id={titleId} title={title} description={description} onClose={onClose} />
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex flex-wrap justify-end gap-2 border-t border-border bg-surface-muted/40 px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

export function Drawer(props: OverlayProps) {
  if (!props.open || typeof document === 'undefined') return null;
  return <DrawerPanel {...props} />;
}

function DrawerPanel({ onClose, title, description, children, footer, className }: OverlayProps) {
  const { backdropRef, panelRef } = useOverlayBehavior(onClose, panelItself);
  const titleId = useId();

  return createPortal(
    <div ref={backdropRef} className="fixed inset-0 z-50 flex animate-fade-in justify-end bg-overlay">
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onMouseDown={(event) => event.stopPropagation()}
        className={cn('flex h-full w-full max-w-2xl animate-slide-in-right flex-col border-l border-border bg-surface shadow-ui-lg outline-none', className)}
      >
        <OverlayHeader id={titleId} title={title} description={description} onClose={onClose} />
        <div className="scrollbar-thin flex-1 overflow-y-auto px-5 py-5 sm:px-6">{children}</div>
        {footer && <div className="flex justify-end gap-2 border-t border-border px-5 py-3.5 sm:px-6">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: ReactNode;
  message: ReactNode;
  confirmLabel?: string;
  tone?: 'danger' | 'primary';
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
  children?: ReactNode;
}

export function ConfirmDialog({ open, title, message, confirmLabel = 'Confirm', tone = 'danger', loading, onConfirm, onClose, children }: ConfirmDialogProps) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant={tone} onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="space-y-4 text-sm text-foreground-soft">
        <p>{message}</p>
        {children}
      </div>
    </Modal>
  );
}
