'use client';

import { ArrowDown, ArrowUp, Pencil, Plus, Star, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { LookupType, Permission, StatusCategory } from '@/shared/constants/domain';
import { humanize } from '@/shared/lib/utils';
import { Badge, ColorBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/feedback';
import { Checkbox, ColorInput, Field, Input, Select } from '@/shared/ui/form';
import { Segmented } from '@/shared/ui/layout';
import { ConfirmDialog, Modal } from '@/shared/ui/modal';
import { useCreateLookup, useDeleteLookup, useLookups, useReorderLookups, useUpdateLookup } from '../api';
import type { Lookup } from '../types';

const TYPE_LABELS: Record<LookupType, { title: string; description: string; item: string }> = {
  [LookupType.TASK_STATUS]: { title: 'Task statuses', description: 'The stages a task moves through. Each one is a column on the board.', item: 'status' },
  [LookupType.ISSUE_STATUS]: { title: 'Issue statuses', description: 'The stages a reported problem moves through until it is fixed.', item: 'status' },
  [LookupType.PROJECT_STATUS]: { title: 'Project statuses', description: 'The phases a project moves through, e.g. Planning or Active.', item: 'status' },
  [LookupType.PRIORITY]: { title: 'Priorities', description: 'How urgent a task or issue is.', item: 'priority' },
  [LookupType.ISSUE_SEVERITY]: { title: 'Issue severities', description: 'How serious the impact of a reported problem is.', item: 'severity' },
};

const STATUS_TYPES: LookupType[] = [LookupType.TASK_STATUS, LookupType.ISSUE_STATUS, LookupType.PROJECT_STATUS];

export function WorkflowSettings() {
  const [type, setType] = useState<LookupType>(LookupType.TASK_STATUS);
  const { can } = usePermissions();
  const canManage = can(Permission.LOOKUPS_MANAGE);
  const { data: lookups, isLoading } = useLookups(type);
  const reorder = useReorderLookups();
  const [editing, setEditing] = useState<Lookup | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Lookup | null>(null);

  const move = (index: number, direction: -1 | 1) => {
    const ids = lookups.map((l) => l.id);
    const target = index + direction;
    if (target < 0 || target >= ids.length) return;
    [ids[index], ids[target]] = [ids[target], ids[index]];
    reorder.mutate({ type, ids });
  };

  return (
    <div className="space-y-4">
      <Segmented<LookupType>
        value={type}
        onChange={setType}
        options={(Object.keys(TYPE_LABELS) as LookupType[]).map((value) => ({ value, label: TYPE_LABELS[value].title }))}
      />
      <Card>
        <CardHeader
          title={TYPE_LABELS[type].title}
          description={TYPE_LABELS[type].description}
          actions={
            canManage && (
              <Button size="sm" onClick={() => setEditing('new')}>
                <Plus className="size-3.5" /> Add value
              </Button>
            )
          }
        />
        {isLoading ? (
          <Spinner />
        ) : (
          <ul className="divide-y divide-border">
            {lookups.map((lookup, index) => (
              <li key={lookup.id} className="flex items-center gap-3 px-5 py-3">
                <ColorBadge color={lookup.color} label={lookup.name} />
                {lookup.category && <span className="text-xs text-muted">{humanize(lookup.category)}</span>}
                {lookup.isDefault && (
                  <Badge tone="brand">
                    <Star className="size-3" /> Default
                  </Badge>
                )}
                {canManage && (
                  <div className="ml-auto flex gap-1">
                    <Button variant="ghost" size="icon" aria-label="Move up" disabled={index === 0} onClick={() => move(index, -1)}>
                      <ArrowUp className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Move down" disabled={index === lookups.length - 1} onClick={() => move(index, 1)}>
                      <ArrowDown className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Edit" onClick={() => setEditing(lookup)}>
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete" disabled={lookups.length <= 1} onClick={() => setDeleting(lookup)}>
                      <Trash2 className="size-4 text-danger" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>
      <LookupModal type={type} lookup={editing} onClose={() => setEditing(null)} />
      <DeleteLookupDialog lookup={deleting} options={lookups} onClose={() => setDeleting(null)} />
    </div>
  );
}

function LookupModal({ type, lookup, onClose }: { type: LookupType; lookup: Lookup | 'new' | null; onClose: () => void }) {
  const create = useCreateLookup();
  const update = useUpdateLookup();
  const existing = lookup && lookup !== 'new' ? lookup : null;
  const isStatus = STATUS_TYPES.includes(type);
  const [values, setValues] = useState({ name: '', color: '#64748b', category: StatusCategory.OPEN as string, isDefault: false });

  useEffect(() => {
    if (!lookup) return;
    setValues({
      name: existing?.name ?? '',
      color: existing?.color ?? '#64748b',
      category: existing?.category ?? StatusCategory.OPEN,
      isDefault: existing?.isDefault ?? false,
    });
  }, [lookup, existing]);

  const submit = () => {
    if (!values.name.trim()) return;
    const payload = {
      name: values.name.trim(),
      color: values.color,
      ...(isStatus ? { category: values.category as StatusCategory } : {}),
      ...(values.isDefault ? { isDefault: true } : {}),
    };
    if (existing) update.mutate({ id: existing.id, ...payload }, { onSuccess: onClose });
    else create.mutate({ type, ...payload }, { onSuccess: onClose });
  };

  return (
    <Modal
      open={!!lookup}
      onClose={onClose}
      size="sm"
      title={existing ? 'Edit value' : `New ${TYPE_LABELS[type].title.toLowerCase().replace(/s$/, '').replace(/ie$/, 'y')}`}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending || update.isPending} disabled={!values.name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="Name" required>
          <Input autoFocus value={values.name} onChange={(e) => setValues({ ...values, name: e.target.value })} />
        </Field>
        <Field label="Color">
          <ColorInput value={values.color} onChange={(color) => setValues({ ...values, color })} />
        </Field>
        {isStatus && (
          <Field label="Category" hint="Drives progress and reporting: Closed statuses count as done.">
            <Select value={values.category} onChange={(e) => setValues({ ...values, category: e.target.value })}>
              {Object.values(StatusCategory).map((c) => (
                <option key={c} value={c}>
                  {humanize(c)}
                </option>
              ))}
            </Select>
          </Field>
        )}
        {!existing?.isDefault && (
          <Checkbox id="lookup-default" label="Use as default for new items" checked={values.isDefault} onChange={(e) => setValues({ ...values, isDefault: e.target.checked })} />
        )}
      </div>
    </Modal>
  );
}

function DeleteLookupDialog({ lookup, options, onClose }: { lookup: Lookup | null; options: Lookup[]; onClose: () => void }) {
  const remove = useDeleteLookup();
  const [replacementId, setReplacementId] = useState('');
  const others = options.filter((o) => o.id !== lookup?.id);

  useEffect(() => setReplacementId(others[0]?.id ?? ''), [lookup]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <ConfirmDialog
      open={!!lookup}
      onClose={onClose}
      title={`Delete "${lookup?.name}"`}
      message="Anything currently using this value will be moved to the replacement you choose."
      confirmLabel="Delete"
      loading={remove.isPending}
      onConfirm={() => lookup && remove.mutate({ id: lookup.id, replacementId: replacementId || undefined }, { onSuccess: onClose })}
    >
      <Field label="Replace with">
        <Select value={replacementId} onChange={(e) => setReplacementId(e.target.value)}>
          {others.map((o) => (
            <option key={o.id} value={o.id}>
              {o.name}
            </option>
          ))}
        </Select>
      </Field>
    </ConfirmDialog>
  );
}
