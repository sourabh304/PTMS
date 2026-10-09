'use client';

import { ChevronDown, MoreHorizontal, Palette, Pencil, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { GROUP_COLORS } from '@/features/task-lists/group-colors';
import { cn } from '@/shared/lib/utils';
import { DropdownItem, DropdownSeparator } from '@/shared/ui/dropdown';
import { InlineEdit } from '@/shared/ui/inline-edit';
import { Popover } from '@/shared/ui/popover';
import type { Task } from '../../types';
import { GroupSummary } from './group-summary';
import { GROUP_STRIP_WIDTH, TABLE_COLUMNS, TABLE_GRID, TABLE_MIN_WIDTH } from './table-columns';
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
}

/** One colored group of the project table: header, column titles, rows, quick add and summary. */
export function TableGroup({ group, tasks, context, autoEditName, onAddTask, onRename, onRecolor, onDelete }: TableGroupProps) {
  const [collapsed, setCollapsed] = useState(false);
  // Bumping the key remounts the name editor directly in edit mode.
  const [renameKey, setRenameKey] = useState(0);
  const editable = context.canEdit && group.id !== null;
  const countLabel = `${tasks.length} ${tasks.length === 1 ? 'task' : 'tasks'}`;

  return (
    <section aria-label={group.name} className="mb-8">
      <header className="sticky left-0 mb-1.5 flex max-w-full items-center gap-1.5">
        <button
          type="button"
          onClick={() => setCollapsed((value) => !value)}
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
        <span className="whitespace-nowrap text-xs text-muted">{countLabel}</span>
        {editable && (
          <GroupMenu color={group.color} onStartRename={onRename && (() => setRenameKey((key) => key + 1))} onRecolor={onRecolor} onDelete={onDelete} />
        )}
      </header>

      {collapsed ? (
        <button
          type="button"
          onClick={() => setCollapsed(false)}
          className="flex h-10 w-full items-center gap-3 overflow-hidden rounded-ui border border-border bg-surface pr-4 text-left text-sm"
          style={{ minWidth: Math.min(TABLE_MIN_WIDTH, 480) }}
        >
          <span className="h-full shrink-0" style={{ width: GROUP_STRIP_WIDTH, backgroundColor: group.color }} />
          <span className="font-medium" style={{ color: group.color }}>
            {group.name}
          </span>
          <span className="text-xs text-muted">{countLabel}</span>
        </button>
      ) : (
        <div role="table" aria-label={`${group.name} tasks`} className="overflow-hidden rounded-ui border-l-0">
          <ColumnHeader color={group.color} />
          {tasks.map((task) => (
            <TaskRow key={task.id} task={task} color={group.color} context={context} />
          ))}
          {context.canEdit && <AddTaskRow color={group.color} onAdd={onAddTask} />}
          <GroupSummary tasks={tasks} />
        </div>
      )}
    </section>
  );
}

function ColumnHeader({ color }: { color: string }) {
  return (
    <div
      role="row"
      className="grid h-9 rounded-tl-ui border-y border-r border-border bg-surface text-xs font-medium text-muted"
      style={{ gridTemplateColumns: TABLE_GRID, minWidth: TABLE_MIN_WIDTH }}
    >
      <span aria-hidden className="sticky left-0 z-[1] rounded-tl-ui" style={{ backgroundColor: color }} />
      <span role="columnheader" className="sticky z-[1] flex items-center border-r border-border bg-surface pl-3.5" style={{ left: GROUP_STRIP_WIDTH }}>
        Task
      </span>
      {TABLE_COLUMNS.map((column) => (
        <span key={column.id} role="columnheader" className="flex items-center justify-center border-r border-border last:border-r-0">
          {column.label}
        </span>
      ))}
    </div>
  );
}

function AddTaskRow({ color, onAdd }: { color: string; onAdd: (title: string) => void }) {
  const [title, setTitle] = useState('');
  const submit = () => {
    const value = title.trim();
    if (!value) return;
    onAdd(value);
    setTitle('');
  };
  return (
    <div className="grid h-10 border-b border-r border-border bg-surface" style={{ gridTemplateColumns: TABLE_GRID, minWidth: TABLE_MIN_WIDTH }}>
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
      trigger={({ ref, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={() => {
            setView('menu');
            toggle();
          }}
          aria-label="Group actions"
          className="flex size-7 items-center justify-center rounded-ui text-muted hover:bg-surface-muted hover:text-foreground"
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
