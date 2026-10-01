'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useProjects } from '@/features/projects/api';
import { useTasks } from '@/features/tasks/api';
import { appConfig } from '@/shared/config/env';
import { todayInputDate, toInputDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Checkbox, Field, Input, Select, Textarea } from '@/shared/ui/form';
import { Modal } from '@/shared/ui/modal';
import { useSaveTimeEntry } from '../api';
import type { TimeEntry } from '../types';

const MAX_MINUTES = 24 * 60;

const schema = z
  .object({
    projectId: z.string().min(1, 'Choose a project'),
    taskId: z.string().optional(),
    date: z.string().min(1, 'Date is required'),
    hours: z.coerce.number().int().min(0).max(24),
    minutes: z.coerce.number().int().min(0).max(59),
    notes: z.string().max(2000).optional(),
    isBillable: z.boolean(),
  })
  .refine((v) => v.hours * 60 + v.minutes > 0 && v.hours * 60 + v.minutes <= MAX_MINUTES, {
    path: ['minutes'],
    message: 'Enter between 1 minute and 24 hours',
  });
type Values = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onClose: () => void;
  entry?: TimeEntry;
  /** Pre-select (and lock) a project / task, e.g. when logging from a task. */
  projectId?: string;
  taskId?: string;
}

export function TimeEntryModal({ open, onClose, entry, projectId, taskId }: Props) {
  const save = useSaveTimeEntry();
  const form = useForm<z.input<typeof schema>, unknown, Values>({ resolver: zodResolver(schema) });
  const { errors } = form.formState;
  const selectedProject = form.watch('projectId');
  const lockedProject = !!(entry || projectId);

  const { data: projects } = useProjects({ limit: appConfig.boardPageSize });
  const { data: tasks } = useTasks({ projectId: selectedProject, limit: appConfig.boardPageSize, sortBy: 'number' }, !!selectedProject);

  useEffect(() => {
    if (!open) return;
    form.reset({
      projectId: entry?.projectId ?? projectId ?? '',
      taskId: entry?.taskId ?? taskId ?? '',
      date: entry ? toInputDate(entry.date) : todayInputDate(),
      hours: entry ? Math.floor(entry.minutes / 60) : 1,
      minutes: entry ? entry.minutes % 60 : 0,
      notes: entry?.notes ?? '',
      isBillable: entry?.isBillable ?? true,
    });
  }, [open, entry, projectId, taskId, form]);

  const onSubmit = form.handleSubmit((values) =>
    save.mutate(
      {
        id: entry?.id,
        projectId: entry?.projectId ?? projectId ?? values.projectId,
        taskId: taskId ?? (values.taskId || null),
        date: values.date,
        minutes: values.hours * 60 + values.minutes,
        notes: values.notes || null,
        isBillable: values.isBillable,
      },
      { onSuccess: onClose },
    ),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={entry ? 'Edit time entry' : 'Log time'}
      description={entry ? 'Editing sends the entry back for approval.' : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={save.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-4">
        <Field label="Project" required error={errors.projectId?.message} className="sm:col-span-4">
          <Select disabled={lockedProject} {...form.register('projectId', { onChange: () => form.setValue('taskId', '') })}>
            <option value="">Select project</option>
            {projects?.data.map((p) => (
              <option key={p.id} value={p.id}>
                {p.key} · {p.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Task" className="sm:col-span-4">
          <Select disabled={!selectedProject || !!taskId} {...form.register('taskId')}>
            <option value="">General project work</option>
            {tasks?.data.map((t) => (
              <option key={t.id} value={t.id}>
                {t.project.key}-{t.number} · {t.title}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Date" required error={errors.date?.message} className="sm:col-span-2">
          <Input type="date" {...form.register('date')} />
        </Field>
        <Field label="Hours" className="sm:col-span-1">
          <Input type="number" min={0} max={24} {...form.register('hours')} />
        </Field>
        <Field label="Minutes" error={errors.minutes?.message} className="sm:col-span-1">
          <Input type="number" min={0} max={59} step={5} {...form.register('minutes')} />
        </Field>
        <Field label="Notes" className="sm:col-span-4">
          <Textarea rows={3} placeholder="What did you work on?" {...form.register('notes')} />
        </Field>
        <Checkbox id="isBillable" label="Billable" className="sm:col-span-4" {...form.register('isBillable')} />
      </form>
    </Modal>
  );
}
