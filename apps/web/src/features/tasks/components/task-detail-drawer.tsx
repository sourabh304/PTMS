'use client';

import { Clock, Link2, Plus, Trash2, X } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CommentThread } from '@/features/comments/components/comment-thread';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { useMilestones } from '@/features/milestones/api';
import { useProject, useProjectMembers } from '@/features/projects/api';
import { useTaskLists } from '@/features/task-lists/api';
import { TimeEntryModal } from '@/features/timesheets/components/time-entry-modal';
import { UserMultiSelect } from '@/features/users/components/user-multi-select';
import { appConfig } from '@/shared/config/env';
import { LookupType } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDateTime, formatMinutes, fullName, toInputDate } from '@/shared/lib/utils';
import { AvatarGroup } from '@/shared/ui/avatar';
import { ColorBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ProgressBar } from '@/shared/ui/layout';
import { ConfirmDialog, Drawer } from '@/shared/ui/modal';
import { useAddDependency, useDeleteTask, useRemoveDependency, useTask, useTasks, useUpdateTask } from '../api';
import type { TaskDetail, TaskUpdate } from '../types';
import { TaskFormModal } from './task-form-modal';

interface Props {
  taskId: string | null;
  onClose: () => void;
  onOpenTask: (id: string) => void;
}

export function TaskDetailDrawer({ taskId, onClose, onOpenTask }: Props) {
  const { data: task, isLoading, isError, error } = useTask(taskId);
  return (
    <Drawer
      open={!!taskId}
      onClose={onClose}
      title={task ? `${task.project.key}-${task.number}` : 'Task'}
      description={task && <span className="text-muted">{task.project.name}</span>}
    >
      {isLoading ? (
        <Spinner />
      ) : isError || !task ? (
        <ErrorState message={errorMessage(error, 'Task not found')} />
      ) : (
        <TaskDetailBody key={task.id} task={task} onClose={onClose} onOpenTask={onOpenTask} />
      )}
    </Drawer>
  );
}

function TaskDetailBody({ task, onClose, onOpenTask }: { task: TaskDetail; onClose: () => void; onOpenTask: (id: string) => void }) {
  const { data: project } = useProject(task.projectId);
  const canEdit = !!project?.access.canEdit && !project.isArchived;
  const update = useUpdateTask();
  const remove = useDeleteTask();
  const { data: members } = useProjectMembers(task.projectId);
  const { data: taskLists } = useTaskLists(task.projectId);
  const { data: milestones } = useMilestones(task.projectId);
  const memberOptions = useMemo(() => (members ?? []).map((m) => m.user), [members]);

  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description ?? '');
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [loggingTime, setLoggingTime] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const save = (patch: TaskUpdate) => update.mutate({ id: task.id, ...patch });

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <Input
          aria-label="Title"
          disabled={!canEdit}
          className="h-auto border-transparent px-0 text-lg font-semibold shadow-none hover:border-border focus:px-3"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={() => title.trim() && title !== task.title && save({ title: title.trim() })}
        />
        {task.parent && (
          <button type="button" onClick={() => onOpenTask(task.parent!.id)} className="text-xs text-brand hover:underline">
            ↑ Subtask of {task.project.key}-{task.parent.number} {task.parent.title}
          </button>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <ColorBadge color={task.status.color} label={task.status.name} />
          <ColorBadge color={task.priority.color} label={task.priority.name} variant="dot" />
          <span className="text-xs text-muted">
            Created by {fullName(task.createdBy)} · {formatDateTime(task.createdAt)}
          </span>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Status">
          <LookupSelect type={LookupType.TASK_STATUS} disabled={!canEdit} value={task.statusId} onChange={(e) => save({ statusId: e.target.value })} />
        </Field>
        <Field label="Priority">
          <LookupSelect type={LookupType.PRIORITY} disabled={!canEdit} value={task.priorityId} onChange={(e) => save({ priorityId: e.target.value })} />
        </Field>
        <Field label="Assignees" className="sm:col-span-2">
          {canEdit ? (
            <UserMultiSelect options={memberOptions} value={task.assignees.map((a) => a.id)} onChange={(ids) => save({ assigneeIds: ids })} />
          ) : (
            <AvatarGroup users={task.assignees} max={6} size="sm" />
          )}
        </Field>
        <Field label="Start date">
          <Input type="date" disabled={!canEdit} defaultValue={toInputDate(task.startDate)} onBlur={(e) => e.target.value !== toInputDate(task.startDate) && save({ startDate: e.target.value || null })} />
        </Field>
        <Field label="Due date">
          <Input type="date" disabled={!canEdit} defaultValue={toInputDate(task.dueDate)} onBlur={(e) => e.target.value !== toInputDate(task.dueDate) && save({ dueDate: e.target.value || null })} />
        </Field>
        <Field label="Task list">
          <Select disabled={!canEdit} value={task.taskListId ?? ''} onChange={(e) => save({ taskListId: e.target.value || null })}>
            <option value="">No list</option>
            {taskLists?.map((l) => (
              <option key={l.id} value={l.id}>
                {l.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Milestone">
          <Select disabled={!canEdit} value={task.milestoneId ?? ''} onChange={(e) => save({ milestoneId: e.target.value || null })}>
            <option value="">No milestone</option>
            {milestones?.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Estimate (hours)">
          <Input
            type="number"
            min={0}
            step="0.5"
            disabled={!canEdit}
            defaultValue={task.estimatedHours ?? ''}
            onBlur={(e) => {
              const value = e.target.value === '' ? null : Number(e.target.value);
              if (value !== task.estimatedHours) save({ estimatedHours: value });
            }}
          />
        </Field>
        <Field label={`Progress · ${task.progress}%`}>
          <input
            type="range"
            min={0}
            max={100}
            step={5}
            disabled={!canEdit}
            defaultValue={task.progress}
            className="mt-2 w-full accent-[var(--brand)]"
            onMouseUp={(e) => save({ progress: Number((e.target as HTMLInputElement).value) })}
            onKeyUp={(e) => save({ progress: Number((e.target as HTMLInputElement).value) })}
          />
        </Field>
      </div>

      <Field label="Description">
        <Textarea
          rows={5}
          disabled={!canEdit}
          placeholder="Add more detail…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={() => description !== (task.description ?? '') && save({ description: description || null })}
        />
      </Field>

      <Section
        title={`Subtasks (${task.subtasks.length})`}
        action={
          canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setAddingSubtask(true)}>
              <Plus className="h-3.5 w-3.5" /> Add
            </Button>
          )
        }
      >
        {task.subtasks.length ? (
          <ul className="clay-inset divide-y divide-border/70 rounded-2xl">
            {task.subtasks.map((sub) => (
              <li key={sub.id}>
                <button type="button" onClick={() => onOpenTask(sub.id)} className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm hover:bg-surface-muted">
                  <span className="text-xs text-muted">
                    {task.project.key}-{sub.number}
                  </span>
                  <span className="flex-1 truncate">{sub.title}</span>
                  <ColorBadge color={sub.status.color} label={sub.status.name} />
                  <AvatarGroup users={sub.assignees} />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">No subtasks.</p>
        )}
      </Section>

      <DependenciesSection task={task} canEdit={canEdit} onOpenTask={onOpenTask} />

      <Section
        title="Time tracking"
        action={
          canEdit && (
            <Button size="sm" variant="secondary" onClick={() => setLoggingTime(true)}>
              <Clock className="h-3.5 w-3.5" /> Log time
            </Button>
          )
        }
      >
        <div className="flex items-center gap-4 text-sm">
          <span>
            Logged <strong>{formatMinutes(task.loggedMinutes)}</strong>
            {task.estimatedHours ? ` of ${task.estimatedHours}h estimated` : ''}
          </span>
          {task.estimatedHours ? <ProgressBar className="max-w-48" value={(task.loggedMinutes / 60 / task.estimatedHours) * 100} /> : null}
        </div>
      </Section>

      <Section title="Comments">
        <CommentThread target={{ taskId: task.id }} />
      </Section>

      {canEdit && (
        <div className="border-t border-border pt-4">
          <Button variant="ghost" className="text-danger" onClick={() => setConfirmDelete(true)}>
            <Trash2 className="h-4 w-4" /> Delete task
          </Button>
        </div>
      )}

      <TaskFormModal open={addingSubtask} onClose={() => setAddingSubtask(false)} projectId={task.projectId} defaults={{ parentId: task.id, taskListId: task.taskListId ?? undefined }} />
      <TimeEntryModal open={loggingTime} onClose={() => setLoggingTime(false)} projectId={task.projectId} taskId={task.id} />
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete task"
        message={`Delete ${task.project.key}-${task.number} and its ${task.subtasks.length} subtask(s)? This cannot be undone.`}
        confirmLabel="Delete"
        loading={remove.isPending}
        onConfirm={() => remove.mutate(task.id, { onSuccess: onClose })}
      />
    </div>
  );
}

function DependenciesSection({ task, canEdit, onOpenTask }: { task: TaskDetail; canEdit: boolean; onOpenTask: (id: string) => void }) {
  const [adding, setAdding] = useState(false);
  const [predecessorId, setPredecessorId] = useState('');
  const add = useAddDependency();
  const remove = useRemoveDependency();
  const { data: candidates } = useTasks({ projectId: task.projectId, limit: appConfig.boardPageSize, sortBy: 'number' }, adding);
  const existing = new Set(task.predecessors.map((p) => p.predecessor.id));

  return (
    <Section
      title="Dependencies"
      action={
        canEdit &&
        !adding && (
          <Button size="sm" variant="secondary" onClick={() => setAdding(true)}>
            <Link2 className="h-3.5 w-3.5" /> Add blocker
          </Button>
        )
      }
    >
      {adding && (
        <div className="mb-3 flex gap-2">
          <Select value={predecessorId} onChange={(e) => setPredecessorId(e.target.value)}>
            <option value="">This task waits on…</option>
            {candidates?.data
              .filter((t) => t.id !== task.id && !existing.has(t.id))
              .map((t) => (
                <option key={t.id} value={t.id}>
                  {t.project.key}-{t.number} · {t.title}
                </option>
              ))}
          </Select>
          <Button
            disabled={!predecessorId}
            loading={add.isPending}
            onClick={() =>
              add.mutate(
                { taskId: task.id, predecessorId },
                {
                  onSuccess: () => {
                    setAdding(false);
                    setPredecessorId('');
                  },
                },
              )
            }
          >
            Add
          </Button>
          <Button variant="ghost" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <DependencyList
          label="Waiting on"
          items={task.predecessors.map((d) => ({ dependencyId: d.id, task: d.predecessor }))}
          projectKey={task.project.key}
          onOpen={onOpenTask}
          onRemove={canEdit ? (dependencyId) => remove.mutate({ taskId: task.id, dependencyId }) : undefined}
        />
        <DependencyList
          label="Blocking"
          items={task.successors.map((d) => ({ dependencyId: d.id, task: d.successor }))}
          projectKey={task.project.key}
          onOpen={onOpenTask}
          onRemove={canEdit ? (dependencyId) => remove.mutate({ taskId: task.id, dependencyId }) : undefined}
        />
      </div>
    </Section>
  );
}

function DependencyList({
  label,
  items,
  projectKey,
  onOpen,
  onRemove,
}: {
  label: string;
  items: { dependencyId: string; task: TaskDetail['predecessors'][number]['predecessor'] }[];
  projectKey: string;
  onOpen: (id: string) => void;
  onRemove?: (dependencyId: string) => void;
}) {
  return (
    <div className="clay-sm rounded-2xl p-3.5">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">{label}</p>
      {items.length ? (
        <ul className="space-y-1.5">
          {items.map(({ dependencyId, task }) => (
            <li key={dependencyId} className="flex items-center gap-2 text-sm">
              <button type="button" onClick={() => onOpen(task.id)} className="min-w-0 flex-1 truncate text-left hover:text-brand">
                <span className="text-xs text-muted">
                  {projectKey}-{task.number}
                </span>{' '}
                {task.title}
              </button>
              <ColorBadge color={task.status.color} label={task.status.name} variant="dot" />
              {onRemove && (
                <button type="button" aria-label="Remove dependency" onClick={() => onRemove(dependencyId)} className="text-muted hover:text-danger">
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">None</p>
      )}
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold">{title}</h3>
        {action}
      </div>
      {children}
    </section>
  );
}
