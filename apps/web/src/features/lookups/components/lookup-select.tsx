'use client';

import { forwardRef, type SelectHTMLAttributes } from 'react';
import type { LookupType } from '@/shared/constants/domain';
import { Select } from '@/shared/ui/form';
import { useLookups } from '../api';

interface LookupSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  type: LookupType;
  /** Adds an empty first option with this label (e.g. "All statuses"). */
  emptyLabel?: string;
}

/** Select bound to an organization's configurable values (statuses, priorities, severities). */
export const LookupSelect = forwardRef<HTMLSelectElement, LookupSelectProps>(({ type, emptyLabel, ...props }, ref) => {
  const { data: lookups } = useLookups(type);
  return (
    <Select ref={ref} {...props}>
      {emptyLabel !== undefined && <option value="">{emptyLabel}</option>}
      {lookups.map((lookup) => (
        <option key={lookup.id} value={lookup.id}>
          {lookup.name}
        </option>
      ))}
    </Select>
  );
});
LookupSelect.displayName = 'LookupSelect';
