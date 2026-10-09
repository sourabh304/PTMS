'use client';

import { ListFilter, Search, X } from 'lucide-react';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { LookupType } from '@/shared/constants/domain';
import { cn, fullName } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { Button } from '@/shared/ui/button';
import { Checkbox, Field, Input, Select } from '@/shared/ui/form';
import { Popover } from '@/shared/ui/popover';

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
  className?: string;
}

/** Search box plus one "Filter" popover holding status, priority, person and overdue. */
export function TaskFilters({ value, onChange, members, hideStatus, className }: Props) {
  const set = <K extends keyof TaskFilterState>(key: K, next: TaskFilterState[K]) => onChange({ ...value, [key]: next });
  const active = [!hideStatus && value.statusId, value.priorityId, value.assigneeId, value.overdue].filter(Boolean).length;
  return (
    <div className={cn('flex flex-wrap items-center gap-2', className)}>
      <div className="relative w-full max-w-64 sm:w-64">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <Input className="pl-9" placeholder="Search tasks or ID" aria-label="Search tasks" value={value.search} onChange={(e) => set('search', e.target.value)} />
      </div>
      <Popover
        className="w-72 p-3"
        trigger={({ ref, open, toggle }) => (
          <Button ref={ref} variant="secondary" onClick={toggle} aria-expanded={open} className={cn(active > 0 && 'border-brand/40 bg-brand-soft text-brand')}>
            <ListFilter /> Filter
            {active > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-foreground">{active}</span>}
          </Button>
        )}
      >
        {() => (
          <div className="space-y-3">
            {!hideStatus && (
              <Field label="Status" htmlFor="task-filter-status">
                <LookupSelect id="task-filter-status" type={LookupType.TASK_STATUS} emptyLabel="All statuses" value={value.statusId} onChange={(e) => set('statusId', e.target.value)} />
              </Field>
            )}
            <Field label="Priority" htmlFor="task-filter-priority">
              <LookupSelect id="task-filter-priority" type={LookupType.PRIORITY} emptyLabel="All priorities" value={value.priorityId} onChange={(e) => set('priorityId', e.target.value)} />
            </Field>
            {members && (
              <Field label="Person" htmlFor="task-filter-person">
                <Select id="task-filter-person" value={value.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
                  <option value="">Everyone</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id}>
                      {fullName(m)}
                    </option>
                  ))}
                </Select>
              </Field>
            )}
            <Checkbox id="overdue-only" label="Overdue only" checked={value.overdue} onChange={(e) => set('overdue', e.target.checked)} />
          </div>
        )}
      </Popover>
      {(active > 0 || value.search) && (
        <Button variant="ghost" onClick={() => onChange(EMPTY_TASK_FILTERS)} className="text-muted">
          <X /> Clear
        </Button>
      )}
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
