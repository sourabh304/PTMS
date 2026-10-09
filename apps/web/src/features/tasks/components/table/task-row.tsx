'use client';

import { GitBranch, Maximize2, MessageSquare } from 'lucide-react';
import type { Lookup } from '@/features/lookups/types';
import { StatusCategory } from '@/shared/constants/domain';
import { cn } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { InlineEdit } from '@/shared/ui/inline-edit';
import type { Task, TaskUpdate } from '../../types';
import { LookupCell } from './lookup-cell';
import { PeopleCell } from './people-cell';
import { GROUP_STRIP_WIDTH, TABLE_GRID, TABLE_MIN_WIDTH } from './table-columns';
import { TimelineCell } from './timeline-cell';

export interface RowContext {
  statuses: Lookup[];
  priorities: Lookup[];
  members: UserSummary[];
  canEdit: boolean;
  onOpen: (task: Task) => void;
  /** Saves a change; `preview` is shown immediately. */
  onUpdate: (task: Task, input: TaskUpdate, preview: Partial<Task>) => void;
}

/** Cell wrapper: one grid column with the vertical separator of the table. */
const cell = 'h-full min-w-0 border-r border-border';

export function TaskRow({ task, color, context }: { task: Task; color: string; context: RowContext }) {
  const { statuses, priorities, members, canEdit, onOpen, onUpdate } = context;
  const closed = task.status.category === StatusCategory.CLOSED;
  const estimate = task.estimatedHours ?? null;

  return (
    <div role="row" className="group/row grid h-10 border-b border-border bg-surface text-sm hover:bg-surface-hover" style={{ gridTemplateColumns: TABLE_GRID, minWidth: TABLE_MIN_WIDTH }}>
      <span aria-hidden className="sticky left-0 z-[1]" style={{ backgroundColor: color }} />

      <div role="gridcell" className={cn(cell, 'sticky z-[1] flex items-center gap-1.5 bg-inherit pl-2 pr-2')} style={{ left: GROUP_STRIP_WIDTH }}>
        <InlineEdit
          value={task.title}
          disabled={!canEdit}
          onSave={(title) => onUpdate(task, { title }, { title })}
          aria-label="Task title"
          displayClassName={cn('flex-initial', closed && 'text-muted line-through')}
        />
        <button
          type="button"
          onClick={() => onOpen(task)}
          className="ml-auto flex shrink-0 items-center gap-1 rounded-ui px-1.5 py-1 text-xs text-muted opacity-0 transition-opacity hover:bg-surface-muted hover:text-foreground focus-visible:opacity-100 group-hover/row:opacity-100"
        >
          <Maximize2 className="size-3.5" /> Open
        </button>
        {task._count.subtasks > 0 && (
          <span className="inline-flex shrink-0 items-center gap-0.5 text-xs text-muted" title={`${task._count.subtasks} subtasks`}>
            <GitBranch className="size-3.5" /> {task._count.subtasks}
          </span>
        )}
        <button
          type="button"
          onClick={() => onOpen(task)}
          aria-label={`${task._count.comments} updates`}
          title="Updates"
          className={cn('relative flex size-7 shrink-0 items-center justify-center rounded-ui hover:bg-surface-muted', task._count.comments ? 'text-brand' : 'text-border-strong hover:text-muted')}
        >
          <MessageSquare className="size-[18px]" />
          {task._count.comments > 0 && (
            <span className="absolute -bottom-0.5 -right-0.5 min-w-4 rounded-full bg-brand px-1 text-center text-[10px] font-semibold leading-4 text-brand-foreground">
              {task._count.comments}
            </span>
          )}
        </button>
      </div>

      <div role="gridcell" className={cell}>
        <PeopleCell
          assignees={task.assignees}
          candidates={members}
          disabled={!canEdit}
          onChange={(assigneeIds) => onUpdate(task, { assigneeIds }, { assignees: members.filter((m) => assigneeIds.includes(m.id)) })}
        />
      </div>
      <div role="gridcell" className={cn(cell, 'border-r-surface')}>
        <LookupCell label="Status" value={task.status} options={statuses} disabled={!canEdit} onChange={(status) => onUpdate(task, { statusId: status.id }, { statusId: status.id, status })} />
      </div>
      <div role="gridcell" className={cn(cell, 'border-r-surface')}>
        <LookupCell label="Priority" value={task.priority} options={priorities} disabled={!canEdit} onChange={(priority) => onUpdate(task, { priorityId: priority.id }, { priorityId: priority.id, priority })} />
      </div>
      <div role="gridcell" className={cell}>
        <TimelineCell
          startDate={task.startDate}
          dueDate={task.dueDate}
          color={color}
          closed={closed}
          disabled={!canEdit}
          onChange={(dates) => onUpdate(task, dates, dates)}
        />
      </div>
      <div role="gridcell" className={cn(cell, 'flex items-center justify-center px-2')}>
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
      <div role="gridcell" className={cn(cell, 'flex items-center gap-2 px-3')}>
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
          <div className="h-full rounded-full transition-[width]" style={{ width: `${task.progress}%`, backgroundColor: closed ? 'var(--success)' : color }} />
        </div>
        <span className="w-9 text-right text-xs tabular-nums text-muted">{task.progress}%</span>
      </div>
    </div>
  );
}
