'use client';

import { CheckCircle2, Circle, Flag, Pencil, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useProject, useProjectMembers } from '@/features/projects/api';
import { errorMessage } from '@/shared/lib/api-client';
import { cn, formatDate, fullName, isOverdue, toInputDate } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
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

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
        <div className="relative space-y-4 before:absolute before:bottom-4 before:left-5 before:top-4 before:w-0.5 before:bg-border">
          {milestones.map((milestone) => {
            const done = !!milestone.completedAt;
            const late = isOverdue(milestone.dueDate, done);
            return (
              <div key={milestone.id} className="relative flex gap-4">
                <button
                  type="button"
                  disabled={!canEdit}
                  aria-label={done ? 'Mark as open' : 'Mark as completed'}
                  onClick={() => save.mutate({ id: milestone.id, projectId, completed: !done })}
                  className={cn('relative z-[1] mt-4 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 bg-surface', done ? 'border-success text-success' : late ? 'border-danger text-danger' : 'border-brand text-brand')}
                >
                  {done ? <CheckCircle2 className="size-5" /> : <Circle className="size-5" />}
                </button>
                <Card className="flex-1 p-5">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className={cn('font-semibold', done && 'text-muted line-through')}>{milestone.name}</h3>
                      <p className="mt-0.5 text-xs text-muted">
                        {milestone.startDate ? `${formatDate(milestone.startDate)} → ` : 'Due '}
                        <span className={cn(late && 'font-medium text-danger')}>{formatDate(milestone.dueDate)}</span>
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {done ? <Badge tone="success">Completed</Badge> : late ? <Badge tone="danger">Overdue</Badge> : <Badge tone="brand">Open</Badge>}
                      {canEdit && (
                        <>
                          <Button variant="ghost" size="icon" aria-label="Edit milestone" onClick={() => setEditing(milestone)}>
                            <Pencil className="size-4" />
                          </Button>
                          <Button variant="ghost" size="icon" aria-label="Delete milestone" onClick={() => setDeleting(milestone)}>
                            <Trash2 className="size-4 text-danger" />
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  {milestone.description && <p className="mt-3 text-sm text-foreground/80">{milestone.description}</p>}
                  <div className="mt-4 flex flex-wrap items-center gap-6">
                    <div className="min-w-48 flex-1">
                      <div className="mb-1 flex justify-between text-xs">
                        <span className="text-muted">
                          {milestone.stats.completedTasks}/{milestone.stats.totalTasks} tasks
                        </span>
                        <span className="font-semibold">{milestone.stats.progress}%</span>
                      </div>
                      <ProgressBar value={milestone.stats.progress} />
                    </div>
                    {milestone.owner && (
                      <span className="flex items-center gap-2 text-sm">
                        <Avatar user={milestone.owner} size="xs" /> {fullName(milestone.owner)}
                      </span>
                    )}
                  </div>
                </Card>
              </div>
            );
          })}
        </div>
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
