'use client';

import { CheckCircle2, Circle, Flag, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProject, useProjectMembers } from '@/features/projects/api';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatDate, fullName, isOverdue, toInputDate } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { CollapsibleCard } from '@/shared/ui/collapsible';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/shared/ui/dropdown';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { ProgressBar } from '@/shared/ui/layout';
import { ConfirmDialog, Modal } from '@/shared/ui/modal';
import { useDeleteMilestone, useMilestones, useSaveMilestone } from '../api';
import type { Milestone } from '../types';

export function MilestoneBoard({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: milestones, isLoading, isError, error, refetch } = useMilestones(projectId);
  const save = useSaveMilestone();
  const remove = useDeleteMilestone();
  const [editing, setEditing] = useState<Milestone | 'new' | null>(null);
  const [deleting, setDeleting] = useState<Milestone | null>(null);
  const canEdit = !!project?.access.canEdit && !project.isArchived;

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;

  const open = (milestones ?? []).filter((m) => !m.completedAt);
  const completed = (milestones ?? []).filter((m) => !!m.completedAt);
  const cardProps: Omit<TimelineProps, 'milestones'> = {
    canEdit,
    onToggle: (milestone) => save.mutate({ id: milestone.id, projectId, completed: !milestone.completedAt }),
    onEdit: setEditing,
    onDelete: setDeleting,
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted">Key checkpoints and deliverables for this project.</p>
        {canEdit && (
          <Button onClick={() => setEditing('new')}>
            <Plus className="size-4" /> New milestone
          </Button>
        )}
      </div>

      {!milestones?.length ? (
        <Card>
          <EmptyState icon={<Flag className="size-6" />} title="No milestones yet" description="Milestones help you track major phases and deadlines." />
        </Card>
      ) : (
        <>
          {open.length > 0 ? (
            <MilestoneTimeline milestones={open} {...cardProps} />
          ) : (
            <Card>
              <EmptyState icon={<CheckCircle2 className="size-6" />} title="All milestones completed" description="Completed milestones are listed below." />
            </Card>
          )}
          {completed.length > 0 && (
            <CollapsibleCard
              title="Completed"
              meta={`${completed.length} milestone${completed.length === 1 ? '' : 's'}`}
              icon={<CheckCircle2 />}
              defaultOpen={false}
              storageKey={`milestones.completed.${projectId}`}
              bodyClassName="p-[var(--card-p)]"
            >
              <MilestoneTimeline milestones={completed} {...cardProps} />
            </CollapsibleCard>
          )}
        </>
      )}

      <MilestoneModal projectId={projectId} milestone={editing} onClose={() => setEditing(null)} />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete milestone"
        message={`Delete "${deleting?.name}"? Linked tasks are kept but unlinked.`}
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}

interface TimelineProps {
  milestones: Milestone[];
  canEdit: boolean;
  onToggle: (milestone: Milestone) => void;
  onEdit: (milestone: Milestone) => void;
  onDelete: (milestone: Milestone) => void;
}

function MilestoneTimeline({ milestones, canEdit, onToggle, onEdit, onDelete }: TimelineProps) {
  return (
    <div className="relative space-y-3 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-0.5 before:bg-border">
      {milestones.map((milestone) => {
        const done = !!milestone.completedAt;
        const late = isOverdue(milestone.dueDate, done);
        return (
          <div key={milestone.id} className="relative flex gap-4">
            <button
              type="button"
              disabled={!canEdit}
              aria-label={done ? 'Mark as open' : 'Mark as completed'}
              title={done ? 'Mark as open' : 'Mark as completed'}
              onClick={() => onToggle(milestone)}
              className={cn('relative z-[1] mt-3 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-surface', done ? 'border-success text-success' : late ? 'border-danger text-danger' : 'border-brand text-brand')}
            >
              {done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
            </button>
            <Card className="min-w-0 flex-1 px-5 py-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className={cn('font-semibold', done && 'text-muted line-through')}>{milestone.name}</h3>
                  <p className="mt-0.5 text-xs text-muted">
                    {milestone.startDate ? `${formatDate(milestone.startDate)} → ` : 'Due '}
                    <span className={cn(late && 'font-medium text-danger')}>{formatDate(milestone.dueDate)}</span>
                    {milestone.owner && (
                      <span className="ml-2 inline-flex items-center gap-1.5 align-middle">
                        · <Avatar user={milestone.owner} size="xs" /> {fullName(milestone.owner)}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-1">
                  {done ? <Badge tone="success">Completed</Badge> : late ? <Badge tone="danger">Overdue</Badge> : <Badge tone="brand">Open</Badge>}
                  {canEdit && (
                    <Dropdown
                      trigger={({ open, toggle }) => (
                        <Button variant="ghost" size="icon" aria-label="Milestone actions" aria-expanded={open} onClick={toggle}>
                          <MoreHorizontal className="size-4" />
                        </Button>
                      )}
                    >
                      {(close) => (
                        <>
                          <DropdownItem
                            onClick={() => {
                              close();
                              onEdit(milestone);
                            }}
                          >
                            <Pencil /> Edit milestone
                          </DropdownItem>
                          <DropdownItem
                            onClick={() => {
                              close();
                              onToggle(milestone);
                            }}
                          >
                            {done ? <Circle /> : <CheckCircle2 />} {done ? 'Mark as open' : 'Mark as completed'}
                          </DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem
                            danger
                            onClick={() => {
                              close();
                              onDelete(milestone);
                            }}
                          >
                            <Trash2 /> Delete milestone
                          </DropdownItem>
                        </>
                      )}
                    </Dropdown>
                  )}
                </div>
              </div>
              {milestone.description && <p className="mt-2 line-clamp-2 text-sm text-foreground/80" title={milestone.description}>{milestone.description}</p>}
              <div className="mt-3 flex items-center gap-3">
                <ProgressBar value={milestone.stats.progress} className="flex-1" />
                <span className="shrink-0 text-xs tabular-nums text-muted">
                  {milestone.stats.completedTasks}/{milestone.stats.totalTasks} tasks · <span className="font-semibold text-foreground">{milestone.stats.progress}%</span>
                </span>
              </div>
            </Card>
          </div>
        );
      })}
    </div>
  );
}

function MilestoneModal({ projectId, milestone, onClose }: { projectId: string; milestone: Milestone | 'new' | null; onClose: () => void }) {
  const save = useSaveMilestone();
  const { data: members } = useProjectMembers(projectId);
  const existing = milestone && milestone !== 'new' ? milestone : null;
  const [values, setValues] = useState({ name: '', description: '', startDate: '', dueDate: '', ownerId: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    if (!milestone) return;
    setError('');
    setValues({
      name: existing?.name ?? '',
      description: existing?.description ?? '',
      startDate: toInputDate(existing?.startDate),
      dueDate: toInputDate(existing?.dueDate),
      ownerId: existing?.ownerId ?? '',
    });
  }, [milestone, existing]);

  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = () => {
    if (!values.name.trim() || !values.dueDate) return setError('Name and due date are required');
    if (values.startDate && values.startDate > values.dueDate) return setError('Due date must be after the start date');
    save.mutate(
      {
        id: existing?.id,
        projectId,
        name: values.name.trim(),
        description: values.description || null,
        startDate: values.startDate || null,
        dueDate: values.dueDate,
        ownerId: values.ownerId || null,
      },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal
      open={!!milestone}
      onClose={onClose}
      title={existing ? 'Edit milestone' : 'New milestone'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {error && <p className="text-sm text-danger sm:col-span-2">{error}</p>}
        <Field label="Name" required className="sm:col-span-2">
          <Input autoFocus value={values.name} onChange={set('name')} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={3} value={values.description} onChange={set('description')} />
        </Field>
        <Field label="Start date">
          <Input type="date" value={values.startDate} onChange={set('startDate')} />
        </Field>
        <Field label="Due date" required>
          <Input type="date" value={values.dueDate} onChange={set('dueDate')} />
        </Field>
        <Field label="Owner" className="sm:col-span-2">
          <Select value={values.ownerId} onChange={set('ownerId')}>
            <option value="">No owner</option>
            {members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {fullName(m.user)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
