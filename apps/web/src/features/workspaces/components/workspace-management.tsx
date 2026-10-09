'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Plus, ShieldAlert } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthConfig } from '@/features/auth/api';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { passwordSchema } from '@/features/auth/schemas';
import { Permission } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, fullName } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input } from '@/shared/ui/form';
import { PageHeader } from '@/shared/ui/layout';
import { Modal } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useCreateWorkspace, useWorkspaces } from '../api';

/** Root admin console: every workspace on the platform and creation of new ones. */
export function WorkspaceManagement() {
  const { can, user } = usePermissions();
  const [creating, setCreating] = useState(false);
  const allowed = can(Permission.WORKSPACES_MANAGE);
  const { data, isLoading, isError, error, refetch } = useWorkspaces();

  if (user && !allowed) {
    return (
      <EmptyState
        icon={<ShieldAlert className="h-6 w-6" />}
        title="Root administrators only"
        description="Only the platform root administrator can create and manage workspaces."
      />
    );
  }

  return (
    <>
      <PageHeader
        title="Workspaces"
        description="Every organization on the platform. Only root administrators can create new workspaces."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> New workspace
          </Button>
        }
      />
      <Card>
        <CardHeader title="All workspaces" description={data ? `${data.length} workspace${data.length === 1 ? '' : 's'}` : undefined} />
        {isLoading ? (
          <Spinner />
        ) : isError || !data ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : !data.length ? (
          <EmptyState icon={<Building2 className="h-6 w-6" />} title="No workspaces yet" />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Workspace</Th>
                <Th>Owner</Th>
                <Th className="text-right">Users</Th>
                <Th className="text-right">Projects</Th>
                <Th>Created</Th>
              </tr>
            </thead>
            <tbody>
              {data.map((workspace) => (
                <Tr key={workspace.id}>
                  <Td>
                    <p className="font-semibold">{workspace.name}</p>
                    <p className="text-xs text-muted">{workspace.slug}</p>
                  </Td>
                  <Td>
                    {workspace.owner ? (
                      <>
                        <p className="font-medium">{fullName(workspace.owner)}</p>
                        <p className="text-xs text-muted">{workspace.owner.email}</p>
                      </>
                    ) : (
                      <span className="text-muted">—</span>
                    )}
                  </Td>
                  <Td className="text-right tabular-nums">{workspace.userCount}</Td>
                  <Td className="text-right tabular-nums">{workspace.projectCount}</Td>
                  <Td className="whitespace-nowrap text-muted">{formatDate(workspace.createdAt)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
      <CreateWorkspaceModal open={creating} onClose={() => setCreating(false)} />
    </>
  );
}

const workspaceSchema = (minLength: number) =>
  z
    .object({
      organizationName: z.string().trim().min(2, 'Organization name is required'),
      firstName: z.string().trim().min(1, 'First name is required'),
      lastName: z.string().trim().min(1, 'Last name is required'),
      email: z.string().trim().email('Enter a valid email'),
      password: passwordSchema(minLength),
      confirmPassword: z.string(),
    })
    .refine((values) => values.password === values.confirmPassword, { path: ['confirmPassword'], message: 'Passwords do not match' });
type WorkspaceValues = z.infer<ReturnType<typeof workspaceSchema>>;

const EMPTY: WorkspaceValues = { organizationName: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };

function CreateWorkspaceModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: config } = useAuthConfig();
  const minLength = config?.passwordPolicy.minLength ?? 8;
  const create = useCreateWorkspace();
  const schema = useMemo(() => workspaceSchema(minLength), [minLength]);
  const form = useForm<WorkspaceValues>({ resolver: zodResolver(schema), defaultValues: EMPTY });
  const { errors } = form.formState;

  useEffect(() => {
    if (open) form.reset(EMPTY);
  }, [open, form]);

  const onSubmit = form.handleSubmit(({ confirmPassword: _confirm, ...values }) => create.mutate(values, { onSuccess: onClose }));

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New workspace"
      description="Creates an organization with its default workflow and its first owner account."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" form="create-workspace" loading={create.isPending}>
            Create workspace
          </Button>
        </>
      }
    >
      <form id="create-workspace" onSubmit={onSubmit} className="space-y-4" noValidate>
        <Field label="Organization name" htmlFor="organizationName" error={errors.organizationName?.message} required>
          <Input id="organizationName" autoFocus {...form.register('organizationName')} />
        </Field>
        <p className="pt-1 text-xs font-bold uppercase tracking-wider text-muted">Workspace owner</p>
        <div className="grid grid-cols-2 gap-3">
          <Field label="First name" htmlFor="firstName" error={errors.firstName?.message} required>
            <Input id="firstName" {...form.register('firstName')} />
          </Field>
          <Field label="Last name" htmlFor="lastName" error={errors.lastName?.message} required>
            <Input id="lastName" {...form.register('lastName')} />
          </Field>
        </div>
        <Field label="Email" htmlFor="email" error={errors.email?.message} required>
          <Input id="email" type="email" autoComplete="off" {...form.register('email')} />
        </Field>
        <div className="grid gap-3 sm:grid-cols-2">
          <Field label="Initial password" htmlFor="password" error={errors.password?.message} hint={`${minLength}+ chars, upper, lower case and a number`} required>
            <Input id="password" type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
          <Field label="Confirm password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} required>
            <Input id="confirmPassword" type="password" autoComplete="new-password" {...form.register('confirmPassword')} />
          </Field>
        </div>
      </form>
    </Modal>
  );
}
