'use client';

import { useEffect, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/shared/lib/utils';

interface InlineEditProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'children'> {
  value: string;
  /** Called with the trimmed value when it changed; empty values are rejected unless `allowEmpty`. */
  onSave: (value: string) => void;
  /** Rendered while not editing; defaults to the value. */
  children?: ReactNode;
  disabled?: boolean;
  allowEmpty?: boolean;
  /** Start in edit mode (e.g. right after creating the item). */
  autoEdit?: boolean;
  /** Classes of the read-only text button. */
  displayClassName?: string;
}

/** Text that turns into an input on click. Enter or blur saves, Escape cancels. */
export function InlineEdit({ value, onSave, children, disabled, allowEmpty, autoEdit, className, displayClassName, ...inputProps }: InlineEditProps) {
  const [editing, setEditing] = useState(!!autoEdit && !disabled);
  const [draft, setDraft] = useState(value);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) inputRef.current?.select();
  }, [editing]);

  const start = () => {
    if (disabled) return;
    setDraft(value);
    setEditing(true);
  };
  const commit = () => {
    setEditing(false);
    const next = draft.trim();
    if (next === value || (!next && !allowEmpty)) return;
    onSave(next);
  };

  if (editing) {
    return (
      <input
        ref={inputRef}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') setEditing(false);
        }}
        className={cn('h-7 w-full min-w-0 rounded-ui border border-brand bg-surface px-1.5 text-sm text-foreground outline-none', className)}
        {...inputProps}
      />
    );
  }
  return (
    <button
      type="button"
      onClick={start}
      disabled={disabled}
      title={disabled ? undefined : 'Click to edit'}
      className={cn(
        'min-w-0 truncate rounded-ui border border-transparent px-1.5 py-0.5 text-left disabled:cursor-default',
        !disabled && 'hover:border-border-strong',
        displayClassName,
      )}
    >
      {children ?? value}
    </button>
  );
}
