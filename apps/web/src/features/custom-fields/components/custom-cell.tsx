'use client';

import { Check, ExternalLink, Star, X } from 'lucide-react';
import { cn, contrastText } from '@/shared/lib/utils';
import { InlineEdit } from '@/shared/ui/inline-edit';
import { Popover } from '@/shared/ui/popover';
import { MAX_RATING, type CustomField } from '../types';

interface CustomCellProps {
  field: CustomField;
  value: unknown;
  disabled: boolean;
  onChange: (value: unknown) => void;
}

const empty = <span className="text-border-strong">—</span>;

/** Inline editor for one custom column cell, chosen by the column type. */
export function CustomCell({ field, value, disabled, onChange }: CustomCellProps) {
  switch (field.type) {
    case 'TEXT':
      return (
        <div className="flex h-full items-center px-1.5">
          <InlineEdit value={typeof value === 'string' ? value : ''} allowEmpty disabled={disabled} aria-label={field.name} displayClassName="w-full" onSave={(text) => onChange(text || null)}>
            {typeof value === 'string' && value ? value : empty}
          </InlineEdit>
        </div>
      );

    case 'NUMBER':
      return (
        <div className="flex h-full items-center justify-center px-1.5">
          <InlineEdit
            value={typeof value === 'number' ? String(value) : ''}
            allowEmpty
            disabled={disabled}
            type="number"
            inputMode="decimal"
            aria-label={field.name}
            className="text-center"
            displayClassName="w-full text-center tabular-nums"
            onSave={(raw) => {
              if (raw === '') return onChange(null);
              const number = Number(raw);
              if (Number.isFinite(number)) onChange(number);
            }}
          >
            {typeof value === 'number' ? value.toLocaleString() : empty}
          </InlineEdit>
        </div>
      );

    case 'CHECKBOX':
      return (
        <div className="flex h-full items-center justify-center">
          <button
            type="button"
            role="checkbox"
            aria-checked={value === true}
            aria-label={field.name}
            disabled={disabled}
            onClick={() => onChange(value !== true)}
            className={cn(
              'flex size-5 items-center justify-center rounded border transition-colors disabled:cursor-default',
              value === true ? 'border-success bg-success text-white' : 'border-border-strong bg-surface hover:border-success',
            )}
          >
            {value === true && <Check className="size-3.5" strokeWidth={3} />}
          </button>
        </div>
      );

    case 'DATE':
      return (
        <div className="flex h-full items-center justify-center px-1.5">
          <input
            type="date"
            value={typeof value === 'string' ? value : ''}
            disabled={disabled}
            aria-label={field.name}
            onChange={(e) => onChange(e.target.value || null)}
            className="h-7 w-full min-w-0 rounded-ui border border-transparent bg-transparent px-1 text-center text-[13px] text-foreground hover:border-border-strong focus:border-brand focus:outline-none disabled:hover:border-transparent"
          />
        </div>
      );

    case 'LINK': {
      const href = typeof value === 'string' ? value : '';
      return (
        <div className="group/link flex h-full items-center gap-1 px-1.5">
          <InlineEdit value={href} allowEmpty disabled={disabled} aria-label={field.name} displayClassName="min-w-0 flex-1" onSave={(text) => onChange(text || null)}>
            {href ? <span className="text-brand">{href.replace(/^https?:\/\//, '').replace(/\/$/, '')}</span> : empty}
          </InlineEdit>
          {href && (
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label="Open link" className="shrink-0 text-muted hover:text-brand">
              <ExternalLink className="size-3.5" />
            </a>
          )}
        </div>
      );
    }

    case 'TAGS': {
      const tags = Array.isArray(value) ? (value as string[]) : [];
      return (
        <div className="flex h-full items-center px-1.5">
          <InlineEdit
            value={tags.join(', ')}
            allowEmpty
            disabled={disabled}
            aria-label={`${field.name} (comma separated)`}
            displayClassName="flex w-full items-center gap-1 overflow-hidden"
            onSave={(text) => onChange(text ? text.split(',').map((t) => t.trim()).filter(Boolean) : null)}
          >
            {tags.length
              ? tags.map((tag) => (
                  <span key={tag} className="shrink-0 rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                    #{tag}
                  </span>
                ))
              : empty}
          </InlineEdit>
        </div>
      );
    }

    case 'RATING': {
      const rating = typeof value === 'number' ? value : 0;
      return (
        <div className="flex h-full items-center justify-center gap-0.5" role="radiogroup" aria-label={field.name}>
          {Array.from({ length: MAX_RATING }, (_, i) => i + 1).map((star) => (
            <button
              key={star}
              type="button"
              role="radio"
              aria-checked={rating === star}
              aria-label={`${star} star${star === 1 ? '' : 's'}`}
              disabled={disabled}
              // Clicking the current rating clears it.
              onClick={() => onChange(star === rating ? null : star)}
              className="text-border-strong transition-colors hover:text-warning disabled:cursor-default disabled:hover:text-border-strong"
            >
              <Star className={cn('size-4', star <= rating && 'fill-warning text-warning')} />
            </button>
          ))}
        </div>
      );
    }

    case 'DROPDOWN': {
      const selected = field.options.find((o) => o.id === value);
      return (
        <Popover
          align="center"
          disabled={disabled}
          className="w-52"
          trigger={({ ref, toggle }) => (
            <button
              ref={ref}
              type="button"
              onClick={toggle}
              disabled={disabled}
              aria-label={`${field.name}: ${selected?.label ?? 'empty'}`}
              className="flex h-full w-full items-center justify-center truncate px-2 text-[13px] font-medium transition-[filter] hover:brightness-95 disabled:cursor-default"
              style={selected ? { backgroundColor: selected.color, color: contrastText(selected.color) } : undefined}
            >
              {selected ? <span className="truncate">{selected.label}</span> : empty}
            </button>
          )}
        >
          {(close) => (
            <ul className="space-y-1">
              {field.options.map((option) => (
                <li key={option.id}>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      if (option.id !== value) onChange(option.id);
                    }}
                    className="relative flex h-8 w-full items-center justify-center rounded-ui px-6 text-[13px] font-medium hover:brightness-95"
                    style={{ backgroundColor: option.color, color: contrastText(option.color) }}
                  >
                    <span className="truncate">{option.label}</span>
                    {option.id === value && <Check className="absolute right-2 size-3.5" />}
                  </button>
                </li>
              ))}
              {selected && (
                <li>
                  <button
                    type="button"
                    onClick={() => {
                      close();
                      onChange(null);
                    }}
                    className="flex h-8 w-full items-center justify-center gap-1 rounded-ui text-xs font-medium text-muted hover:bg-surface-muted"
                  >
                    <X className="size-3.5" /> Clear
                  </button>
                </li>
              )}
            </ul>
          )}
        </Popover>
      );
    }
  }
}
