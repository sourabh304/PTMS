'use client';

import { Search } from 'lucide-react';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { LookupType } from '@/shared/constants/domain';
import { fullName } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { Checkbox, Input, Select } from '@/shared/ui/form';

export interface TaskFilterState {
  search: string;
  statusId: string;
  priorityId: string;
  assigneeId: string;
  overdue: boolean;
}

export const EMPTY_TASK_FILTERS: TaskFilterState = { search: '', statusId: '', priorityId: '', assigneeId: '', overdue: false };

interface Props {
  value: TaskFilterState;
  onChange: (value: TaskFilterState) => void;
  members?: UserSummary[];
  hideStatus?: boolean;
}

export function TaskFilters({ value, onChange, members, hideStatus }: Props) {
  const set = <K extends keyof TaskFilterState>(key: K, next: TaskFilterState[K]) => onChange({ ...value, [key]: next });
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="relative w-full sm:w-64">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
        <Input className="pl-9" placeholder="Search tasks or ID" value={value.search} onChange={(e) => set('search', e.target.value)} />
      </div>
      {!hideStatus && (
        <LookupSelect type={LookupType.TASK_STATUS} emptyLabel="All statuses" className="w-40" value={value.statusId} onChange={(e) => set('statusId', e.target.value)} />
      )}
      <LookupSelect type={LookupType.PRIORITY} emptyLabel="All priorities" className="w-40" value={value.priorityId} onChange={(e) => set('priorityId', e.target.value)} />
      {members && (
        <Select className="w-44" value={value.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
          <option value="">Everyone</option>
          {members.map((m) => (
            <option key={m.id} value={m.id}>
              {fullName(m)}
            </option>
          ))}
        </Select>
      )}
      <Checkbox id="overdue-only" label="Overdue only" checked={value.overdue} onChange={(e) => set('overdue', e.target.checked)} />
    </div>
  );
}

export function filtersToQuery(filters: TaskFilterState, search: string) {
  return {
    search: search || undefined,
    statusId: filters.statusId || undefined,
    priorityId: filters.priorityId || undefined,
    assigneeId: filters.assigneeId || undefined,
    overdue: filters.overdue || undefined,
  };
}
