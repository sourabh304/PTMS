'use client';

import { ChevronDown, MoreHorizontal, Palette, Pencil, Plus, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { GROUP_COLORS } from '@/features/task-lists/group-colors';
import { cn } from '@/shared/lib/utils';
import { DropdownItem, DropdownSeparator } from '@/shared/ui/dropdown';
import { InlineEdit } from '@/shared/ui/inline-edit';
import { Popover } from '@/shared/ui/popover';
import type { Task } from '../../types';
import { groupTotals, GroupSummary } from './group-summary';
import type { CustomField } from '@/features/custom-fields/types';
import { GROUP_STRIP_WIDTH, type TableLayout } from './table-columns';
import { TaskRow, type RowContext } from './task-row';

export interface GroupModel {
  /** `null` for tasks that are not in any group. */
  id: string | null;
  name: string;
  color: string;
  milestoneId: string | null;
}

interface TableGroupProps {
  group: GroupModel;
  tasks: Task[];
  context: RowContext;
  /** Start with the name in edit mode (a group that was just created). */
  autoEditName?: boolean;
  onAddTask: (title: string) => void;
  onRename?: (name: string) => void;
  onRecolor?: (color: string) => void;
  onDelete?: () => void;
  collapsed: boolean;
  onToggleCollapsed: () => void;
  /** Show the totals row under the tasks. */
  showSummary: boolean;
}

/** One colored group of the project table: header, column titles, rows, quick add and summary. */
export function TableGroup({ group, tasks, context, autoEditName, onAddTask, onRename, onRecolor, onDelete, collapsed, onToggleCollapsed, showSummary }: TableGroupProps) {
  // Bumping the key remounts the name editor directly in edit mode.
  const [renameKey, setRenameKey] = useState(0);
  const editable = context.canEdit && group.id !== null;
  const countLabel = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;
  const totals = groupTotals(tasks);

  return (
    <section aria-label={group.name} className={collapsed ? 'mb-3' : 'mb-7'}>
      <header className="group/header sticky left-0 mb-1.5 flex max-w-full items-center gap-1.5">
        <button
          type="button"
          onClick={onToggleCollapsed}
          aria-expanded={!collapsed}
          aria-label={collapsed ? `Expand ${group.name}` : `Collapse ${group.name}`}
          className="flex size-7 items-center justify-center rounded-ui hover:bg-surface-muted"
          style={{ color: group.color }}
        >
          <ChevronDown className={cn('size-[18px] transition-transform', collapsed && '-rotate-90')} />
        </button>
        <InlineEdit
          key={renameKey}
          value={group.name}
          disabled={!editable || !onRename}
          autoEdit={autoEditName || renameKey > 0}
          onSave={(name) => onRename?.(name)}
          aria-label="Group name"
          displayClassName="text-base font-semibold"
          className="h-8 max-w-sm text-base font-semibold"
          style={{ color: group.color }}
        >
          <span style={{ color: group.color }}>{group.name}</span>
        </InlineEdit>
        <span className="whitespace-nowrap text-xs text-muted">
          {countLabel}
          {tasks.length > 0 && (
            <span className="hidden sm:inline">
              {totals.estimate ? ` · ${totals.estimate}h` : ''} · {totals.progress}% done
            </span>
          )}
        </span>
        {editable && (
          <GroupMenu color={group.color} onStartRename={onRename && (() => setRenameKey((key) => key + 1))} onRecolor={onRecolor} onDelete={onDelete} />
        )}
      </header>

      {!collapsed && (
        <div role="table" aria-label={`${group.name} tasks`} className="overflow-hidden rounded-ui border-l-0">
          <ColumnHeader color={group.color} context={context} />
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} color={group.color} context={context} />
          ))}
          {context.canEdit && <AddTaskRow color={group.color} layout={context.layout} onAdd={onAddTask} />}
          {showSummary && <GroupSummary tasks={tasks} layout={context.layout} customFields={context.customFields} />}
        </div>
      )}
    </section>
  );
}

function ColumnHeader({ color, context }: { color: string; context: RowContext }) {
  const { layout, customFields, canManage } = context;
  return (
    <div
      role="row"
      className="grid h-9 rounded-tl-ui border-y border-r border-border bg-surface text-xs font-medium text-muted"
      style={{ gridTemplateColumns: layout.grid, minWidth: layout.minWidth }}
    >
      <span aria-hidden className="sticky left-0 z-[1] rounded-tl-ui" style={{ backgroundColor: color }} />
      <span role="columnheader" className="sticky z-[1] flex items-center border-r border-border bg-surface pl-3.5" style={{ left: GROUP_STRIP_WIDTH }}>
        Task
      </span>
      {layout.columns.map((column) => (
        <span key={column.id} role="columnheader" className="flex items-center justify-center border-r border-border last:border-r-0">
          {column.label}
        </span>
      ))}
      {customFields.map((field) => (
        <CustomColumnHeader key={field.id} field={field} context={context} />
      ))}
      {layout.addColumn && canManage && (
        <span role="columnheader" className="flex items-center justify-center">
          <button
            type="button"
            onClick={context.onAddColumn}
            aria-label="Add column"
            title="Add column"
            className="flex size-7 items-center justify-center rounded-ui text-muted hover:bg-surface-muted hover:text-foreground"
          >
            <Plus className="size-4" />
          </button>
        </span>
      )}
    </div>
  );
}

function CustomColumnHeader({ field, context }: { field: CustomField; context: RowContext }) {
  if (!context.canManage) {
    return (
      <span role="columnheader" className="flex items-center justify-center truncate border-r border-border px-2 last:border-r-0">
        {field.name}
      </span>
    );
  }
  return (
    <span role="columnheader" className="group/col relative flex items-center justify-center border-r border-border px-6 last:border-r-0">
      <span className="truncate">{field.name}</span>
      <Popover
        align="end"
        className="w-48 p-1"
        trigger={({ ref, toggle }) => (
          <button
            ref={ref}
            type="button"
            onClick={toggle}
            aria-label={`${field.name} column actions`}
            className="absolute right-1 flex size-6 items-center justify-center rounded-ui text-muted opacity-0 hover:bg-surface-muted hover:text-foreground focus-visible:opacity-100 group-hover/col:opacity-100"
          >
            <MoreHorizontal className="size-4" />
          </button>
        )}
      >
        {(close) => (
          <>
            <DropdownItem
              onClick={() => {
                close();
                context.onEditColumn(field);
              }}
            >
              <Pencil /> Edit column
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              onClick={() => {
                close();
                context.onDeleteColumn(field);
              }}
            >
              <Trash2 /> Delete column
            </DropdownItem>
          </>
        )}
      </Popover>
    </span>
  );
}

function AddTaskRow({ color, layout, onAdd }: { color: string; layout: TableLayout; onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const submit = () => {
    const value = title.trim();
    if (!value) return;
    onAdd(value);
    setTitle('');
  };
  return (
    <div className="grid h-10 border-b border-r border-border bg-surface" style={{ gridTemplateColumns: layout.grid, minWidth: layout.minWidth }}>
      <span aria-hidden className="sticky left-0 z-[1] rounded-bl-ui opacity-50" style={{ backgroundColor: color }} />
      <div className="sticky z-[1] col-span-1 flex items-center bg-surface px-2" style={{ left: GROUP_STRIP_WIDTH }}>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && submit()}
          onBlur={submit}
          placeholder="+ Add task"
          aria-label="Add task"
          className="h-7 w-full rounded-ui border border-transparent bg-transparent px-1.5 text-sm placeholder:text-muted hover:border-border-strong focus:border-brand focus:outline-none"
        />
      </div>
    </div>
  );
}

interface GroupMenuProps extends Pick<TableGroupProps, 'onRecolor' | 'onDelete'> {
  color: string;
  onStartRename?: () => void;
}

function GroupMenu({ color, onStartRename, onRecolor, onDelete }: GroupMenuProps) {
  const [view, setView] = useState<'menu' | 'colors'>('menu');
  return (
    <Popover
      className="w-56 p-1"
      trigger={({ ref, open, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={() => {
            setView('menu');
            toggle();
          }}
          aria-label="Group actions"
          className={cn(
            'flex size-7 items-center justify-center rounded-ui text-muted hover:bg-surface-muted hover:text-foreground focus-visible:opacity-100 group-hover/header:opacity-100',
            !open && 'sm:opacity-0',
          )}
        >
          <MoreHorizontal className="size-4" />
        </button>
      )}
    >
      {(close) =>
        view === 'colors' ? (
          <div className="grid grid-cols-5 gap-1.5 p-2">
            {GROUP_COLORS.map((option) => (
              <button
                key={option}
                type="button"
                aria-label={`Use color ${option}`}
                aria-pressed={option === color}
                onClick={() => {
                  close();
                  onRecolor?.(option);
                }}
                className={cn('size-8 rounded-full ring-offset-2 ring-offset-surface transition-transform hover:scale-110', option === color && 'ring-2 ring-foreground')}
                style={{ backgroundColor: option }}
              />
            ))}
          </div>
        ) : (
          <>
            {onRecolor && (
              <DropdownItem onClick={() => setView('colors')}>
                <Palette /> Change color
              </DropdownItem>
            )}
            {onStartRename && (
              <DropdownItem
                onClick={() => {
                  close();
                  onStartRename();
                }}
              >
                <Pencil /> Rename group
              </DropdownItem>
            )}
            {onDelete && (
              <>
                <DropdownSeparator />
                <DropdownItem
                  danger
                  onClick={() => {
                    close();
                    onDelete();
                  }}
                >
                  <Trash2 /> Delete group
                </DropdownItem>
              </>
            )}
          </>
        )
      }
    </Popover>
  );
}
