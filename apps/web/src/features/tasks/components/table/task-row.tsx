'use client';

import { memo } from 'react';
import { GitBranch, Maximize2, MessageSquare } from 'lucide-react';
import { CustomCell } from '@/features/custom-fields/components/custom-cell';
import { readCustomValue, type CustomField } from '@/features/custom-fields/types';
import type { Lookup } from '@/features/lookups/types';
import { StatusCategory } from '@/shared/constants/domain';
import { cn } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { InlineEdit } from '@/shared/ui/inline-edit';
import type { Task, TaskUpdate } from '../../types';
import { LookupCell } from './lookup-cell';
import { PeopleCell } from './people-cell';
import { GROUP_STRIP_WIDTH, type TableLayout } from './table-columns';
import { TimelineCell } from './timeline-cell';

export interface RowContext {
  statuses: Lookup[];
  priorities: Lookup[];
  members: UserSummary[];
  canEdit: boolean;
  /** Project managers add, rename and delete custom columns. */
  canManage: boolean;
  layout: TableLayout;
  customFields: CustomField[];
  onSetCustom: (task: Task, field: CustomField, value: unknown) => void;
  onAddColumn: () => void;
  onEditColumn: (field: CustomField) => void;
  onDeleteColumn: (field: CustomField) => void;
  onOpen: (task: Task) => void;
  /** Saves a change; `preview` is shown immediately. */
  onUpdate: (task: Task, input: TaskUpdate, preview: Partial<Task>) => void;
}

/** Cell wrapper: one grid column with the vertical separator of the table. */
const cell = 'h-full min-w-0 border-r border-border';

/** Memoized: a row re-renders only when its task, colour or the shared table context changes. */
export const TaskRow = memo(function TaskRow({ task, color, context }: { task: Task; color: string; context: RowContext }) {
  const { statuses, priorities, members, canEdit, onOpen, onUpdate, layout, customFields, onSetCustom } = context;
  const closed = task.status.category === StatusCategory.CLOSED;
  const estimate = task.estimatedHours ?? null;

  return (
    <div role="row" className="group/row grid h-10 border-b border-border bg-surface text-sm hover:bg-surface-hover" style={{ gridTemplateColumns: layout.grid, minWidth: layout.minWidth }}>
      <span aria-hidden className="sticky left-0 z-[1]" style={{ backgroundColor: color }} />

      <div role="gridcell" className={cn(cell, 'sticky z-[1] flex items-center gap-1.5 bg-inherit pl-2 pr-2')} style={{ left: GROUP_STRIP_WIDTH }}>
        <InlineEdit
          value={task.title}
          disabled={!canEdit}
          onSave={(title) => onUpdate(task, { title }, { title })}
          aria-label="Task title"
          displayClassName={cn('flex-initial', closed && 'text-muted line-through')}
        />
        <span className="ml-auto flex shrink-0 items-center gap-0.5">
          {/* Shown on hover only, so the title keeps the room the rest of the time. */}
          <button
            type="button"
            onClick={() => onOpen(task)}
            aria-label={`Open ${task.title}`}
            title="Open details"
            className="hidden size-7 items-center justify-center rounded-ui text-muted hover:bg-surface-muted hover:text-foreground focus-visible:flex group-hover/row:flex"
          >
            <Maximize2 className="size-3.5" />
          </button>
          {task._count.subtasks > 0 && (
            <span className="inline-flex shrink-0 items-center gap-0.5 px-1 text-xs text-muted" title={`${task._count.subtasks} subtasks`}>
              <GitBranch className="size-3.5" /> {task._count.subtasks}
            </span>
          )}
          <button
            type="button"
            onClick={() => onOpen(task)}
            aria-label={`${task._count.comments} updates`}
            title="Updates"
            className={cn(
              'relative size-7 shrink-0 items-center justify-center rounded-ui hover:bg-surface-muted',
              task._count.comments ? 'flex text-brand' : 'hidden text-muted focus-visible:flex group-hover/row:flex',
            )}
          >
            <MessageSquare className="size-4" />
            {task._count.comments > 0 && (
              <span className="absolute -bottom-0.5 -right-0.5 min-w-4 rounded-full bg-brand px-1 text-center text-[10px] font-semibold leading-4 text-brand-foreground">
                {task._count.comments}
              </span>
            )}
          </button>
        </span>
      </div>

      {layout.columns.map(({ id }) => {
        switch (id) {
          case 'people':
            return (
              <div key={id} role="gridcell" className={cell}>
                <PeopleCell
                  assignees={task.assignees}
                  candidates={members}
                  disabled={!canEdit}
                  onChange={(assigneeIds) => onUpdate(task, { assigneeIds }, { assignees: members.filter((m) => assigneeIds.includes(m.id)) })}
                />
              </div>
            );
          case 'status':
            return (
              <div key={id} role="gridcell" className={cn(cell, 'border-r-surface')}>
                <LookupCell label="Status" value={task.status} options={statuses} disabled={!canEdit} onChange={(status) => onUpdate(task, { statusId: status.id }, { statusId: status.id, status })} />
              </div>
            );
          case 'priority':
            return (
              <div key={id} role="gridcell" className={cn(cell, 'border-r-surface')}>
                <LookupCell label="Priority" value={task.priority} options={priorities} disabled={!canEdit} onChange={(priority) => onUpdate(task, { priorityId: priority.id }, { priorityId: priority.id, priority })} />
              </div>
            );
          case 'timeline':
            return (
              <div key={id} role="gridcell" className={cell}>
                <TimelineCell startDate={task.startDate} dueDate={task.dueDate} color={color} closed={closed} disabled={!canEdit} onChange={(dates) => onUpdate(task, dates, dates)} />
              </div>
            );
          case 'estimate':
            return (
              <div key={id} role="gridcell" className={cn(cell, 'flex items-center justify-center px-2')}>
                <InlineEdit
                  value={estimate === null ? '' : String(estimate)}
                  disabled={!canEdit}
                  allowEmpty
                  type="number"
                  min={0}
                  step={0.5}
                  inputMode="decimal"
                  aria-label="Estimated hours"
                  className="text-center"
                  displayClassName="w-full text-center tabular-nums"
                  onSave={(raw) => {
                    const hours = raw === '' ? null : Number(raw);
                    if (hours !== null && (!Number.isFinite(hours) || hours < 0)) return;
                    onUpdate(task, { estimatedHours: hours }, { estimatedHours: hours });
                  }}
                >
                  {estimate === null ? <span className="text-border-strong">—</span> : `${estimate}h`}
                </InlineEdit>
              </div>
            );
          case 'progress':
            return (
              <div key={id} role="gridcell" className={cn(cell, 'flex items-center gap-2 px-3')}>
                <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted">
                  <div className="h-full rounded-full transition-[width]" style={{ width: `${task.progress}%`, backgroundColor: closed ? 'var(--success)' : color }} />
                </div>
                <span className="w-9 text-right text-xs tabular-nums text-muted">{task.progress}%</span>
              </div>
            );
          default:
            return null;
        }
      })}
      {customFields.map((field) => (
        <div key={field.id} role="gridcell" className={cell}>
          <CustomCell field={field} value={readCustomValue(task.customValues, field.id)} disabled={!canEdit} onChange={(value) => onSetCustom(task, field, value)} />
        </div>
      ))}
      {layout.addColumn && <div aria-hidden />}
    </div>
  );
});
