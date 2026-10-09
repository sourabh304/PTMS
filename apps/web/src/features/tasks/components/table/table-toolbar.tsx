'use client';

import { FolderPlus, ListFilter, Plus, Search, UserRound, X } from 'lucide-react';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { LookupType } from '@/shared/constants/domain';
import { cn, fullName } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Checkbox, Field } from '@/shared/ui/form';
import { Popover } from '@/shared/ui/popover';
import { EMPTY_TASK_FILTERS, type TaskFilterState } from '../task-filters';

interface TableToolbarProps {
  filters: TaskFilterState;
  onFiltersChange: (filters: TaskFilterState) => void;
  members: UserSummary[];
  canEdit: boolean;
  onNewTask: () => void;
  onNewGroup: () => void;
  creatingGroup?: boolean;
}

const toolbarButton = 'inline-flex h-8 items-center gap-1.5 rounded-ui px-2.5 text-sm text-foreground-soft transition-colors hover:bg-surface-muted';

export function TableToolbar({ filters, onFiltersChange, members, canEdit, onNewTask, onNewGroup, creatingGroup }: TableToolbarProps) {
  const set = <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) => onFiltersChange({ ...filters, [key]: value });
  const person = members.find((m) => m.id === filters.assigneeId);
  const activeFilters = [filters.statusId, filters.priorityId, filters.overdue].filter(Boolean).length;
  const anyFilter = activeFilters > 0 || !!filters.assigneeId || !!filters.search;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      {canEdit && (
        <>
          <Button size="sm" onClick={onNewTask}>
            <Plus /> New task
          </Button>
          <Button size="sm" variant="secondary" onClick={onNewGroup} loading={creatingGroup}>
            <FolderPlus /> New group
          </Button>
          <span className="mx-1.5 hidden h-5 w-px bg-border sm:block" />
        </>
      )}

      <label className="relative">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted" />
        <input
          value={filters.search}
          onChange={(e) => set('search', e.target.value)}
          placeholder="Search"
          aria-label="Search tasks"
          className="h-8 w-40 rounded-ui border border-transparent bg-transparent pl-8 pr-2 text-sm transition-[width,border-color] placeholder:text-foreground-soft hover:border-border focus:w-56 focus:border-brand focus:outline-none"
        />
      </label>

      <Popover
        className="w-60"
        trigger={({ ref, toggle }) => (
          <button ref={ref} type="button" onClick={toggle} className={cn(toolbarButton, person && 'bg-brand-soft text-brand')}>
            {person ? <Avatar user={person} size="xs" className="ring-0" /> : <UserRound className="size-4" />}
            {person ? fullName(person) : 'Person'}
          </button>
        )}
      >
        {(close) => (
          <ul className="scrollbar-thin max-h-72 space-y-px overflow-y-auto">
            <li>
              <button
                type="button"
                onClick={() => {
                  set('assigneeId', '');
                  close();
                }}
                className="w-full rounded-ui px-2 py-1.5 text-left text-sm hover:bg-surface-muted"
              >
                Everyone
              </button>
            </li>
            {members.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => {
                    set('assigneeId', member.id);
                    close();
                  }}
                  className={cn('flex w-full items-center gap-2.5 rounded-ui px-2 py-1.5 text-left text-sm hover:bg-surface-muted', member.id === filters.assigneeId && 'bg-brand-soft')}
                >
                  <Avatar user={member} size="xs" className="ring-0" />
                  <span className="truncate">{fullName(member)}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Popover>

      <Popover
        className="w-64 p-3"
        trigger={({ ref, toggle }) => (
          <button ref={ref} type="button" onClick={toggle} className={cn(toolbarButton, activeFilters > 0 && 'bg-brand-soft text-brand')}>
            <ListFilter className="size-4" /> Filter
            {activeFilters > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-foreground">{activeFilters}</span>}
          </button>
        )}
      >
        {() => (
          <div className="space-y-3">
            <Field label="Status" htmlFor="filter-status">
              <LookupSelect id="filter-status" type={LookupType.TASK_STATUS} emptyLabel="Any status" value={filters.statusId} onChange={(e) => set('statusId', e.target.value)} />
            </Field>
            <Field label="Priority" htmlFor="filter-priority">
              <LookupSelect id="filter-priority" type={LookupType.PRIORITY} emptyLabel="Any priority" value={filters.priorityId} onChange={(e) => set('priorityId', e.target.value)} />
            </Field>
            <Checkbox id="filter-overdue" label="Overdue only" checked={filters.overdue} onChange={(e) => set('overdue', e.target.checked)} />
          </div>
        )}
      </Popover>

      {anyFilter && (
        <button type="button" onClick={() => onFiltersChange(EMPTY_TASK_FILTERS)} className={cn(toolbarButton, 'text-muted')}>
          <X className="size-4" /> Clear
        </button>
      )}
    </div>
  );
}
