'use client';

import { Plus, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { GROUP_COLORS } from '@/features/task-lists/group-colors';
import { cn } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, Input } from '@/shared/ui/form';
import { Modal } from '@/shared/ui/modal';
import { useSaveCustomField } from '../api';
import { CUSTOM_FIELD_TYPES, type CustomField, type CustomFieldType } from '../types';

interface DraftOption {
  id?: string;
  label: string;
  color: string;
}

const DEFAULT_OPTIONS: DraftOption[] = [
  { label: 'Option 1', color: GROUP_COLORS[0] },
  { label: 'Option 2', color: GROUP_COLORS[1] },
];

interface Props {
  projectId: string;
  /** `'new'` to add a column, a field to edit it, `null` when closed. */
  field: CustomField | 'new' | null;
  onClose: () => void;
}

export function CustomFieldModal({ projectId, field, onClose }: Props) {
  const save = useSaveCustomField(projectId);
  const existing = field && field !== 'new' ? field : null;
  const [name, setName] = useState('');
  const [type, setType] = useState<CustomFieldType>('TEXT');
  const [options, setOptions] = useState<DraftOption[]>(DEFAULT_OPTIONS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!field) return;
    setName(existing?.name ?? '');
    setType(existing?.type ?? 'TEXT');
    setOptions(existing?.options.length ? existing.options : DEFAULT_OPTIONS);
    setError(null);
  }, [field, existing]);

  const submit = () => {
    if (!name.trim()) return setError('Give the column a name.');
    const choices = options.map((o) => ({ ...o, label: o.label.trim() })).filter((o) => o.label);
    if (type === 'DROPDOWN' && !choices.length) return setError('Add at least one choice.');
    save.mutate(
      {
        id: existing?.id,
        name: name.trim(),
        ...(existing ? {} : { type }),
        ...(type === 'DROPDOWN' ? { options: choices } : {}),
      },
      { onSuccess: onClose },
    );
  };

  const updateOption = (index: number, patch: Partial<DraftOption>) => setOptions((list) => list.map((o, i) => (i === index ? { ...o, ...patch } : o)));

  return (
    <Modal
      open={!!field}
      onClose={onClose}
      title={existing ? 'Edit column' : 'Add column'}
      description={existing ? `${CUSTOM_FIELD_TYPES.find((t) => t.value === existing.type)?.label} column` : 'Track anything else about your items.'}
      size="lg"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            {existing ? 'Save column' : 'Add column'}
          </Button>
        </>
      }
    >
      <div className="space-y-5">
        <Field label="Column name" required error={error && !name.trim() ? error : undefined}>
          <Input value={name} onChange={(e) => setName(e.target.value)} maxLength={40} autoFocus placeholder="e.g. Client, Budget, Phase" />
        </Field>

        {!existing && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground-soft">Type</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {CUSTOM_FIELD_TYPES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setType(option.value)}
                  aria-pressed={type === option.value}
                  className={cn(
                    'rounded-ui border px-3 py-2.5 text-left transition-colors',
                    type === option.value ? 'border-brand bg-brand-soft' : 'border-border hover:bg-surface-hover',
                  )}
                >
                  <span className="block text-sm font-medium">{option.label}</span>
                  <span className="block text-[11px] leading-4 text-muted">{option.description}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {type === 'DROPDOWN' && (
          <div>
            <p className="mb-2 text-[13px] font-medium text-foreground-soft">Choices</p>
            <ul className="space-y-2">
              {options.map((option, index) => (
                <li key={option.id ?? `new-${index}`} className="flex items-center gap-2">
                  <ColorPicker value={option.color} onChange={(color) => updateOption(index, { color })} />
                  <Input value={option.label} onChange={(e) => updateOption(index, { label: e.target.value })} maxLength={40} aria-label={`Choice ${index + 1}`} />
                  <Button variant="ghost" size="icon" aria-label="Remove choice" onClick={() => setOptions((list) => list.filter((_, i) => i !== index))}>
                    <X />
                  </Button>
                </li>
              ))}
            </ul>
            <Button
              variant="secondary"
              size="sm"
              className="mt-2"
              onClick={() => setOptions((list) => [...list, { label: '', color: GROUP_COLORS[list.length % GROUP_COLORS.length] }])}
            >
              <Plus /> Add choice
            </Button>
            {error && name.trim() && <p className="mt-2 text-xs text-danger">{error}</p>}
          </div>
        )}
      </div>
    </Modal>
  );
}

function ColorPicker({ value, onChange }: { value: string; onChange: (color: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button type="button" aria-label="Choice color" onClick={() => setOpen((v) => !v)} className="size-8 shrink-0 rounded-ui border border-border" style={{ backgroundColor: value }} />
      {open && (
        <div className="absolute left-0 top-10 z-10 grid w-44 grid-cols-5 gap-1.5 rounded-ui-lg border border-border bg-surface p-2 shadow-ui-lg">
          {GROUP_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Use ${color}`}
              onClick={() => {
                onChange(color);
                setOpen(false);
              }}
              className={cn('size-6 rounded-full', color === value && 'ring-2 ring-foreground ring-offset-1 ring-offset-surface')}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
