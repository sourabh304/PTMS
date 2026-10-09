'use client';

import { Archive, ArchiveRestore, FolderKanban, Package, Pencil, Plus, Trash2, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { BillingInterval } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatMoney, humanize } from '@/shared/lib/utils';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Skeleton } from '@/shared/ui/feedback';
import { Checkbox, Field, FormAlert, Input, Select, Textarea } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { ConfirmDialog, Modal } from '@/shared/ui/modal';
import { useDeletePlan, usePlans, useSavePlan } from '../api';
import type { Plan } from '../types';

const MINOR_UNITS = 100;

export function PlansView() {
  const [showInactive, setShowInactive] = useState(false);
  const [editing, setEditing] = useState<Plan | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Plan | null>(null);
  const { data: plans, isLoading, isError, error, refetch } = usePlans(showInactive);
  const save = useSavePlan();
  const remove = useDeletePlan();

  return (
    <>
      <PageHeader
        title="Plans"
        description="The catalogue of plans organizations can subscribe to. Only the root account can change it."
        actions={
          <>
            <Checkbox id="show-inactive" label="Show deactivated" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} />
            <Button onClick={() => setEditing('new')}>
              <Plus /> New plan
            </Button>
          </>
        }
      />

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-60 rounded-ui-lg" />
          ))}
        </div>
      ) : isError ? (
        <Card>
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        </Card>
      ) : !plans?.length ? (
        <Card>
          <EmptyState icon={<Package />} title="No plans yet" description="Create the first plan organizations can subscribe to." />
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={cn('flex flex-col p-[var(--card-p)] transition-[border-color,box-shadow] hover:shadow-ui-md', !plan.isActive && 'opacity-70')}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-mono text-[11px] font-medium uppercase tracking-wide text-muted">{plan.code}</p>
                  <h3 className="truncate text-lg font-semibold text-foreground">{plan.name}</h3>
                </div>
                {plan.isActive ? <Badge tone="success">Active</Badge> : <Badge>Deactivated</Badge>}
              </div>
              <p className="mt-3 text-3xl font-semibold tracking-tight text-foreground">
                {formatMoney(plan.priceCents, plan.currency)}
                <span className="text-sm font-normal text-muted"> / {plan.billingInterval === BillingInterval.YEARLY ? 'year' : 'month'}</span>
              </p>
              <p className="mt-2 line-clamp-2 min-h-10 text-sm text-muted">{plan.description || 'No description.'}</p>
              <ul className="mt-4 space-y-2 text-sm text-foreground-soft">
                <li className="flex items-center gap-2">
                  <Users className="size-4 text-muted" /> {plan.maxUsers ?? 'Unlimited'} users
                </li>
                <li className="flex items-center gap-2">
                  <FolderKanban className="size-4 text-muted" /> {plan.maxProjects ?? 'Unlimited'} projects
                </li>
              </ul>
              <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3.5 text-xs text-muted">
                <span>
                  {plan._count?.subscriptions ?? 0} {plan._count?.subscriptions === 1 ? 'subscription' : 'subscriptions'}
                </span>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" aria-label="Edit plan" onClick={() => setEditing(plan)}>
                    <Pencil />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label={plan.isActive ? 'Deactivate plan' : 'Reactivate plan'}
                    title={plan.isActive ? 'Deactivate (no new subscriptions)' : 'Reactivate'}
                    onClick={() => save.mutate({ id: plan.id, isActive: !plan.isActive })}
                  >
                    {plan.isActive ? <Archive /> : <ArchiveRestore />}
                  </Button>
                  <Button variant="ghost" size="icon" aria-label="Delete plan" onClick={() => setDeleting(plan)}>
                    <Trash2 className="text-danger" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <PlanFormModal plan={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete plan"
        message={`Delete the ${deleting?.name} plan? Plans that have subscriptions cannot be deleted — deactivate them instead.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </>
  );
}

const EMPTY = { code: '', name: '', description: '', price: '', currency: '', billingInterval: BillingInterval.MONTHLY as string, maxUsers: '', maxProjects: '' };

function PlanFormModal({ plan, onClose }: { plan: Plan | 'new' | null; onClose: () => void }) {
  const save = useSavePlan();
  const existing = plan && plan !== 'new' ? plan : null;
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!plan) return;
    setError('');
    setValues(
      existing
        ? {
            code: existing.code,
            name: existing.name,
            description: existing.description ?? '',
            price: (existing.priceCents / MINOR_UNITS).toFixed(2),
            currency: existing.currency,
            billingInterval: existing.billingInterval,
            maxUsers: existing.maxUsers?.toString() ?? '',
            maxProjects: existing.maxProjects?.toString() ?? '',
          }
        : EMPTY,
    );
  }, [plan, existing]);

  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value }));
  const limit = (value: string) => (value.trim() === '' ? null : Number(value));

  const submit = () => {
    const price = Number(values.price);
    if (!values.name.trim()) return setError('Name is required');
    if (!existing && !/^[A-Z][A-Z0-9_]{1,31}$/.test(values.code)) return setError('Code must be 2-32 upper-case letters, digits or underscores');
    if (!Number.isFinite(price) || price < 0) return setError('Enter a valid price');
    save.mutate(
      {
        id: existing?.id,
        ...(existing ? {} : { code: values.code }),
        name: values.name.trim(),
        description: values.description.trim() || null,
        priceCents: Math.round(price * MINOR_UNITS),
        ...(values.currency ? { currency: values.currency.toUpperCase() } : {}),
        billingInterval: values.billingInterval as BillingInterval,
        maxUsers: limit(values.maxUsers),
        maxProjects: limit(values.maxProjects),
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={!!plan}
      onClose={onClose}
      title={existing ? `Edit ${existing.name}` : 'New plan'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Save plan
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-6">
        {error && (
          <div className="sm:col-span-6">
            <FormAlert>{error}</FormAlert>
          </div>
        )}
        <Field label="Name" required className="sm:col-span-4">
          <Input autoFocus value={values.name} onChange={set('name')} placeholder="Business" />
        </Field>
        <Field label="Code" required hint={existing ? 'Codes cannot change' : 'Unique, e.g. BUSINESS'} className="sm:col-span-2">
          <Input className="font-mono uppercase" disabled={!!existing} value={values.code} onChange={(e) => setValues((v) => ({ ...v, code: e.target.value.toUpperCase() }))} />
        </Field>
        <Field label="Description" className="sm:col-span-6">
          <Textarea rows={2} value={values.description} onChange={set('description')} />
        </Field>
        <Field label="Price" required className="sm:col-span-2">
          <Input type="number" min={0} step="0.01" value={values.price} onChange={set('price')} />
        </Field>
        <Field label="Currency" hint="Blank = platform default" className="sm:col-span-2">
          <Input className="uppercase" maxLength={3} value={values.currency} onChange={set('currency')} placeholder="USD" />
        </Field>
        <Field label="Billing" className="sm:col-span-2">
          <Select value={values.billingInterval} onChange={set('billingInterval')}>
            {Object.values(BillingInterval).map((b) => (
              <option key={b} value={b}>
                {humanize(b)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Max users" hint="Blank = unlimited" className="sm:col-span-3">
          <Input type="number" min={1} value={values.maxUsers} onChange={set('maxUsers')} />
        </Field>
        <Field label="Max projects" hint="Blank = unlimited" className="sm:col-span-3">
          <Input type="number" min={1} value={values.maxProjects} onChange={set('maxProjects')} />
        </Field>
      </div>
    </Modal>
  );
}
