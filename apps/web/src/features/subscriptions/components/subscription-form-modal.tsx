'use client';

import { useEffect, useState } from 'react';
import { usePlatformOrganizations } from '@/features/platform/api';
import { usePlans } from '@/features/plans/api';
import { appConfig } from '@/shared/config/env';
import { SubscriptionStatus } from '@/shared/constants/domain';
import { formatMoney, humanize, todayInputDate, toInputDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, FormAlert, Input, Select, Textarea } from '@/shared/ui/form';
import { Modal } from '@/shared/ui/modal';
import { useSaveSubscription } from '../api';
import type { Subscription } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
  subscription?: Subscription;
  /** Pre-selects (and locks) the organization, e.g. from the organization drawer. */
  organizationId?: string;
}

const EMPTY = { organizationId: '', planId: '', status: SubscriptionStatus.ACTIVE as string, startDate: '', endDate: '', notes: '' };

export function SubscriptionFormModal({ open, onClose, subscription, organizationId }: Props) {
  const save = useSaveSubscription();
  const { data: plans } = usePlans();
  const { data: organizations } = usePlatformOrganizations({ limit: appConfig.boardPageSize });
  const [values, setValues] = useState(EMPTY);
  const [error, setError] = useState('');
  const lockedOrganization = !!(subscription || organizationId);

  useEffect(() => {
    if (!open) return;
    setError('');
    setValues({
      organizationId: subscription?.organizationId ?? organizationId ?? '',
      planId: subscription?.planId ?? '',
      status: subscription?.status ?? SubscriptionStatus.ACTIVE,
      startDate: subscription ? toInputDate(subscription.startDate) : todayInputDate(),
      endDate: toInputDate(subscription?.endDate),
      notes: subscription?.notes ?? '',
    });
  }, [open, subscription, organizationId]);

  const set = (key: keyof typeof EMPTY) => (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = () => {
    if (!values.organizationId || !values.planId) return setError('Choose an organization and a plan');
    if (values.endDate && values.endDate < values.startDate) return setError('End date must be on or after the start date');
    save.mutate(
      {
        id: subscription?.id,
        organizationId: values.organizationId,
        planId: values.planId,
        status: values.status as SubscriptionStatus,
        startDate: values.startDate || undefined,
        endDate: values.endDate || null,
        notes: values.notes.trim() || null,
      },
      { onSuccess: onClose },
    );
  };

  // Deactivated plans stay selectable only for the subscription that already uses them.
  const selectablePlans = (plans ?? []).filter((p) => p.isActive || p.id === subscription?.planId);
  const replacesCurrent = !subscription && (values.status === SubscriptionStatus.ACTIVE || values.status === SubscriptionStatus.TRIAL);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={subscription ? 'Edit subscription' : 'Assign a plan'}
      description={replacesCurrent ? 'Any current subscription of this organization will be canceled automatically.' : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {error && (
          <div className="sm:col-span-2">
            <FormAlert>{error}</FormAlert>
          </div>
        )}
        <Field label="Organization" required className="sm:col-span-2">
          <Select disabled={lockedOrganization} value={values.organizationId} onChange={set('organizationId')}>
            <option value="">Select organization</option>
            {organizations?.data.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Plan" required className="sm:col-span-2">
          <Select value={values.planId} onChange={set('planId')}>
            <option value="">Select plan</option>
            {selectablePlans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} · {formatMoney(p.priceCents, p.currency)} / {p.billingInterval === 'YEARLY' ? 'year' : 'month'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Status">
          <Select value={values.status} onChange={set('status')}>
            {Object.values(SubscriptionStatus).map((s) => (
              <option key={s} value={s}>
                {humanize(s)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date">
          <Input type="date" value={values.startDate} onChange={set('startDate')} />
        </Field>
        <Field label="End date" hint="Leave empty for an open-ended subscription" className="sm:col-span-2">
          <Input type="date" value={values.endDate} min={values.startDate} onChange={set('endDate')} />
        </Field>
        <Field label="Internal notes" className="sm:col-span-2">
          <Textarea rows={2} value={values.notes} onChange={set('notes')} placeholder="e.g. invoice reference, negotiated terms" />
        </Field>
      </div>
    </Modal>
  );
}
