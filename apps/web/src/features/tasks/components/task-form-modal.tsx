'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { useMilestones } from '@/features/milestones/api';
import { useProjectMembers } from '@/features/projects/api';
import { useTaskLists } from '@/features/task-lists/api';
import { UserMultiSelect } from '@/features/users/components/user-multi-select';
import { LookupType } from '@/shared/constants/domain';
import { Button } from '@/shared/ui/button';
import { Disclosure } from '@/shared/ui/collapsible';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { Modal } from '@/shared/ui/modal';
import { useCreateTask } from '../api';
import type { Task } from '../types';

const schema = z
  .object({
    title: z.string().trim().min(1, 'Title is required').max(250),
    description: z.string().max(20000).optional(),
    statusId: z.string().optional(),
    priorityId: z.string().optional(),
    taskListId: z.string().optional(),
    milestoneId: z.string().optional(),
    startDate: z.string().optional(),
    dueDate: z.string().optional(),
    estimatedHours: z.string().optional(),
    assigneeIds: z.array(z.string()),
  })
  .refine((v) => !v.startDate || !v.dueDate || v.dueDate >= v.startDate, {
    path: ['dueDate'],
    message: 'Due date must be on or after the start date',
  });
type Values = z.infer<typeof schema>;

export interface TaskFormDefaults {
  statusId?: string;
  taskListId?: string;
  milestoneId?: string;
  parentId?: string;
}

interface Props {
  open: boolean;
  onClose: () => void;
  projectId: string;
  defaults?: TaskFormDefaults;
  onCreated?: (task: Task) => void;
}

export function TaskFormModal({ open, onClose, projectId, defaults, onCreated }: Props) {
  const create = useCreateTask();
  const { data: members } = useProjectMembers(projectId);
  const { data: taskLists } = useTaskLists(projectId);
  const { data: milestones } = useMilestones(projectId);
  const memberOptions = useMemo(() => (members ?? []).map((m) => m.user), [members]);

  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { assigneeIds: [] } });
  const { errors } = form.formState;

  useEffect(() => {
    if (!open) return;
    form.reset({
      title: '',
      description: '',
      statusId: defaults?.statusId ?? '',
      priorityId: '',
      taskListId: defaults?.taskListId ?? '',
      milestoneId: defaults?.milestoneId ?? '',
      startDate: '',
      dueDate: '',
      estimatedHours: '',
      assigneeIds: [],
    });
  }, [open, defaults, form]);

  const onSubmit = form.handleSubmit((values) =>
    create.mutate(
      {
        projectId,
        title: values.title,
        description: values.description || undefined,
        statusId: values.statusId || undefined,
        priorityId: values.priorityId || undefined,
        taskListId: values.taskListId || undefined,
        milestoneId: values.milestoneId || undefined,
        parentId: defaults?.parentId,
        startDate: values.startDate || undefined,
        dueDate: values.dueDate || undefined,
        estimatedHours: values.estimatedHours ? Number(values.estimatedHours) : undefined,
        assigneeIds: values.assigneeIds,
      },
      {
        onSuccess: (task) => {
          onCreated?.(task);
          onClose();
        },
      },
    ),
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title={defaults?.parentId ? 'New subtask' : 'New task'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending}>
            Create task
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-6">
        <Field label="Title" required error={errors.title?.message} className="sm:col-span-6">
          <Input autoFocus placeholder="What needs to be done?" {...form.register('title')} />
        </Field>
        <Field label="Description" className="sm:col-span-6">
          <Textarea rows={3} {...form.register('description')} />
        </Field>
        <Field label="Status" className="sm:col-span-3">
          <LookupSelect type={LookupType.TASK_STATUS} emptyLabel="Default" {...form.register('statusId')} />
        </Field>
        <Field label="Priority" className="sm:col-span-3">
          <LookupSelect type={LookupType.PRIORITY} emptyLabel="Default" {...form.register('priorityId')} />
        </Field>
        <Field label="Start date" className="sm:col-span-3">
          <Input type="date" {...form.register('startDate')} />
        </Field>
        <Field label="Due date" error={errors.dueDate?.message} className="sm:col-span-3">
          <Input type="date" {...form.register('dueDate')} />
        </Field>
        <Field label="Assignees" className="sm:col-span-6">
          <Controller
            control={form.control}
            name="assigneeIds"
            render={({ field }) => <UserMultiSelect options={memberOptions} value={field.value} onChange={field.onChange} placeholder="Assign project members" />}
          />
        </Field>
        <Disclosure label={defaults?.parentId ? 'More options · estimate' : 'More options · group, milestone, estimate'} className="sm:col-span-6">
          <div className="grid gap-4 sm:grid-cols-6">
            {!defaults?.parentId && (
              <>
                <Field label="Task list" className="sm:col-span-2">
                  <Select {...form.register('taskListId')}>
                    <option value="">No list</option>
                    {taskLists?.map((list) => (
                      <option key={list.id} value={list.id}>
                        {list.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Milestone" className="sm:col-span-2">
                  <Select {...form.register('milestoneId')}>
                    <option value="">No milestone</option>
                    {milestones?.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            )}
            <Field label="Estimate (hours)" className="sm:col-span-2">
              <Input type="number" min={0} step="0.5" {...form.register('estimatedHours')} />
            </Field>
          </div>
        </Disclosure>
      </form>
    </Modal>
  );
}
