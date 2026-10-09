'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { usePasswordMinLength } from '@/features/auth/api';
import { PasswordInput } from '@/features/auth/components/password-input';
import { passwordSchema } from '@/features/auth/schemas';
import { Button } from '@/shared/ui/button';
import { Field, Input } from '@/shared/ui/form';
import { Modal } from '@/shared/ui/modal';
import { useCreateWorkspace } from '../api';

const workspaceSchema = (minLength: number) =>
  z.object({
    name: z.string().trim().min(2, 'Enter the company or team name'),
    ownerFirstName: z.string().trim().min(1, 'Required'),
    ownerLastName: z.string().trim().min(1, 'Required'),
    ownerEmail: z.string().trim().email('Enter a valid email'),
    ownerPassword: passwordSchema(minLength),
  });
type WorkspaceValues = z.infer<ReturnType<typeof workspaceSchema>>;

const EMPTY: WorkspaceValues = { name: '', ownerFirstName: '', ownerLastName: '', ownerEmail: '', ownerPassword: '' };

export function WorkspaceFormModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const create = useCreateWorkspace();
  const minLength = usePasswordMinLength();
  const schema = useMemo(() => workspaceSchema(minLength), [minLength]);
  const form = useForm<WorkspaceValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  const onSubmit = form.handleSubmit((values) => create.mutate(values, { onSuccess: onClose }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New workspace"
      description="A separate space for another company or team, with its own people and projects."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending}>
            Create workspace
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <Field label="Workspace name" required error={errors.name?.message} hint="Usually the company or team name" className="sm:col-span-2">
          <Input autoFocus placeholder="Acme Inc." {...form.register('name')} />
        </Field>
        <p className="text-sm font-medium sm:col-span-2">Workspace owner</p>
        <Field label="First name" required error={errors.ownerFirstName?.message}>
          <Input autoComplete="off" {...form.register('ownerFirstName')} />
        </Field>
        <Field label="Last name" required error={errors.ownerLastName?.message}>
          <Input autoComplete="off" {...form.register('ownerLastName')} />
        </Field>
        <Field label="Email" required error={errors.ownerEmail?.message} hint="They sign in with this email" className="sm:col-span-2">
          <Input type="email" autoComplete="off" {...form.register('ownerEmail')} />
        </Field>
        <Field
          label="First password"
          required
          error={errors.ownerPassword?.message}
          hint={`At least ${minLength} characters, with an upper-case letter, a lower-case letter and a number. Share it with the owner; they can change it in My profile.`}
          className="sm:col-span-2"
        >
          <PasswordInput autoComplete="new-password" {...form.register('ownerPassword')} />
        </Field>
      </form>
    </Modal>
  );
}
