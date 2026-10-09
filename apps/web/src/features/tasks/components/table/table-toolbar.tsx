'use client';

import { ChevronDown, ChevronsDownUp, ChevronsUpDown, Columns3, FolderPlus, ListFilter, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { LookupType } from '@/shared/constants/domain';
import { cn, fullName } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { Dropdown, DropdownItem } from '@/shared/ui/dropdown';
import { Checkbox, Field, Select } from '@/shared/ui/form';
import { Popover } from '@/shared/ui/popover';
import { EMPTY_TASK_FILTERS, type TaskFilterState } from '../task-filters';

interface ColumnOption {
  id: string;
  label: string;
}

export interface TableViewControls {
  columns: ColumnOption[];
  hiddenColumns: string[];
  onToggleColumn: (id: string) => void;
  onShowAllColumns: () => void;
  showSummary: boolean;
  onShowSummaryChange: (value: boolean) => void;
  onCollapseAll: () => void;
  onExpandAll: () => void;
  /** Managers can add a custom column from the view menu. */
  onAddColumn?: () => void;
}

interface TableToolbarProps {
  filters: TaskFilterState;
  onFiltersChange: (filters: TaskFilterState) => void;
  members: UserSummary[];
  canEdit: boolean;
  onNewTask: () => void;
  onNewGroup: () => void;
  creatingGroup?: boolean;
  view: TableViewControls;
}

const toolbarButton = 'inline-flex h-8 items-center gap-1.5 rounded-ui px-2.5 text-sm text-foreground-soft transition-colors hover:bg-surface-muted';
const sectionLabel = 'px-1 pb-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted';

export function TableToolbar({ filters, onFiltersChange, members, canEdit, onNewTask, onNewGroup, creatingGroup, view }: TableToolbarProps) {
  const set = <K extends keyof TaskFilterState>(key: K, value: TaskFilterState[K]) => onFiltersChange({ ...filters, [key]: value });
  const person = members.find((m) => m.id === filters.assigneeId);
  const activeFilters = [filters.assigneeId, filters.statusId, filters.priorityId, filters.overdue].filter(Boolean).length;
  const anyFilter = activeFilters > 0 || !!filters.search;
  const hiddenCount = view.columns.filter((c) => view.hiddenColumns.includes(c.id)).length;

  return (
    <div className="mb-5 flex flex-wrap items-center gap-1.5">
      {canEdit && (
        <>
          <div className="inline-flex">
            <Button size="sm" onClick={onNewTask} className="rounded-r-none">
              <Plus /> New task
            </Button>
            <Dropdown
              align="left"
              trigger={({ open, toggle }) => (
                <Button
                  size="sm"
                  onClick={toggle}
                  aria-expanded={open}
                  aria-label="More ways to add"
                  loading={creatingGroup}
                  className="rounded-l-none border-l border-brand-foreground/25 px-2"
                >
                  {!creatingGroup && <ChevronDown />}
                </Button>
              )}
            >
              {(close) => (
                <>
                  <DropdownItem
                    onClick={() => {
                      close();
                      onNewTask();
                    }}
                  >
                    <Plus /> New task
                  </DropdownItem>
                  <DropdownItem
                    onClick={() => {
                      close();
                      onNewGroup();
                    }}
                  >
                    <FolderPlus /> New group
                  </DropdownItem>
                </>
              )}
            </Dropdown>
          </div>
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
          className="h-8 w-32 rounded-ui border border-transparent bg-transparent pl-8 pr-2 text-sm transition-[width,border-color] placeholder:text-foreground-soft hover:border-border focus:w-52 focus:border-brand focus:outline-none sm:w-40 sm:focus:w-56"
        />
      </label>

      <Popover
        className="w-72 p-3"
        trigger={({ ref, open, toggle }) => (
          <button ref={ref} type="button" onClick={toggle} aria-expanded={open} className={cn(toolbarButton, activeFilters > 0 && 'bg-brand-soft text-brand')}>
            {person ? <Avatar user={person} size="xs" className="ring-0" /> : <ListFilter className="size-4" />}
            Filter
            {activeFilters > 0 && <span className="rounded-full bg-brand px-1.5 text-[11px] font-semibold text-brand-foreground">{activeFilters}</span>}
          </button>
        )}
      >
        {() => (
          <div className="space-y-3">
            <Field label="Person" htmlFor="filter-person">
              <Select id="filter-person" value={filters.assigneeId} onChange={(e) => set('assigneeId', e.target.value)}>
                <option value="">Everyone</option>
                {members.map((member) => (
                  <option key={member.id} value={member.id}>
                    {fullName(member)}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Status" htmlFor="filter-status">
              <LookupSelect id="filter-status" type={LookupType.TASK_STATUS} emptyLabel="Any status" value={filters.statusId} onChange={(e) => set('statusId', e.target.value)} />
            </Field>
            <Field label="Priority" htmlFor="filter-priority">
              <LookupSelect id="filter-priority" type={LookupType.PRIORITY} emptyLabel="Any priority" value={filters.priorityId} onChange={(e) => set('priorityId', e.target.value)} />
            </Field>
            <Checkbox id="filter-overdue" label="Overdue only" checked={filters.overdue} onChange={(e) => set('overdue', e.target.checked)} />
            {activeFilters > 0 && (
              <div className="border-t border-border pt-2">
                <Button variant="ghost" size="sm" onClick={() => onFiltersChange({ ...EMPTY_TASK_FILTERS, search: filters.search })}>
                  <X /> Reset filters
                </Button>
              </div>
            )}
          </div>
        )}
      </Popover>

      <Popover
        className="w-64 p-2"
        trigger={({ ref, open, toggle }) => (
          <button ref={ref} type="button" onClick={toggle} aria-expanded={open} className={cn(toolbarButton, hiddenCount > 0 && 'text-brand')}>
            <SlidersHorizontal className="size-4" /> View
            {hiddenCount > 0 && <span className="text-xs text-muted">· {hiddenCount} hidden</span>}
          </button>
        )}
      >
        {(close) => (
          <div>
            <div className="flex items-center justify-between">
              <p className={sectionLabel}>
                <Columns3 className="mr-1 inline size-3.5 align-[-2px]" /> Columns
              </p>
              {hiddenCount > 0 && (
                <button type="button" onClick={view.onShowAllColumns} className="pb-1.5 text-xs font-medium text-brand hover:underline">
                  Show all
                </button>
              )}
            </div>
            <ul className="scrollbar-thin max-h-80 space-y-0.5 overflow-y-auto">
              <li className="px-2 py-1">
                <Checkbox id="col-task" label="Task" checked disabled />
              </li>
              {view.columns.map((column) => (
                <li key={column.id} className="rounded-ui px-2 py-1 hover:bg-surface-muted">
                  <Checkbox id={`col-${column.id}`} label={column.label} checked={!view.hiddenColumns.includes(column.id)} onChange={() => view.onToggleColumn(column.id)} className="w-full" />
                </li>
              ))}
            </ul>
            {view.onAddColumn && (
              <DropdownItem
                onClick={() => {
                  close();
                  view.onAddColumn?.();
                }}
              >
                <Plus /> Add column
              </DropdownItem>
            )}
            <div className="-mx-2 my-2 h-px bg-border" />
            <div className="px-2 py-1">
              <Checkbox id="view-summary" label="Group summary rows" checked={view.showSummary} onChange={(e) => view.onShowSummaryChange(e.target.checked)} />
            </div>
            <div className="-mx-2 my-2 h-px bg-border" />
            <DropdownItem
              onClick={() => {
                close();
                view.onCollapseAll();
              }}
            >
              <ChevronsDownUp /> Collapse all groups
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                close();
                view.onExpandAll();
              }}
            >
              <ChevronsUpDown /> Expand all groups
            </DropdownItem>
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
