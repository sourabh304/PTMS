'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { KeyRound, Pencil, Plus, Search, UserCheck, UserX } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useAuthConfig, useSession } from '@/features/auth/api';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { passwordSchema } from '@/features/auth/schemas';
import { appConfig } from '@/shared/config/env';
import { ORG_ROLES, Permission, type OrgRole } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDateTime, fullName, humanize } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader } from '@/shared/ui/card';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select } from '@/shared/ui/form';
import { Pagination } from '@/shared/ui/layout';
import { Modal } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useCreateUser, useResetPassword, useUpdateUser, useUsers } from '../api';
import type { User } from '../types';

export function UserManagement() {
  const { can } = usePermissions();
  const { data: session } = useSession();
  const canManage = can(Permission.USERS_MANAGE);
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [status, setStatus] = useState('active');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<User | 'new' | null>(null);
  const [resetting, setResetting] = useState<User | null>(null);
  const debounced = useDebounce(search);
  const update = useUpdateUser();

  useEffect(() => setPage(1), [debounced, role, status]);

  const { data, isLoading, isError, error, refetch } = useUsers({
    search: debounced || undefined,
    role: (role || undefined) as OrgRole | undefined,
    isActive: status === 'all' ? undefined : status === 'active',
    page,
    limit: appConfig.defaultPageSize,
  });

  return (
    <Card>
      <CardHeader
        title="Users"
        description="People in your organization and their access level."
        actions={
          canManage && (
            <Button size="sm" onClick={() => setEditing('new')}>
              <Plus className="h-3.5 w-3.5" /> Add user
            </Button>
          )
        }
      />
      <div className="flex flex-wrap gap-3 border-b border-border px-5 py-3">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-40" value={role} onChange={(e) => setRole(e.target.value)}>
          <option value="">All roles</option>
          {ORG_ROLES.map((r) => (
            <option key={r} value={r}>
              {humanize(r)}
            </option>
          ))}
        </Select>
        <Select className="w-36" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="active">Active</option>
          <option value="inactive">Deactivated</option>
          <option value="all">All</option>
        </Select>
      </div>
      {isLoading ? (
        <Spinner />
      ) : isError || !data ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <Th>Name</Th>
                <Th>Role</Th>
                <Th>Job title</Th>
                <Th>Status</Th>
                <Th>Last sign-in</Th>
                {canManage && <Th className="w-32" />}
              </tr>
            </thead>
            <tbody>
              {data.data.map((user) => (
                <Tr key={user.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <Avatar user={user} />
                      <div>
                        <p className="font-medium">
                          {fullName(user)} {user.id === session?.id && <span className="text-xs text-muted">(you)</span>}
                        </p>
                        <p className="text-xs text-muted">{user.email}</p>
                      </div>
                    </div>
                  </Td>
                  <Td>
                    <Badge tone={user.role === 'OWNER' || user.role === 'ADMIN' ? 'brand' : 'neutral'}>{humanize(user.role)}</Badge>
                  </Td>
                  <Td className="text-muted">{user.jobTitle ?? '—'}</Td>
                  <Td>{user.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Deactivated</Badge>}</Td>
                  <Td className="whitespace-nowrap text-muted">{formatDateTime(user.lastLoginAt)}</Td>
                  {canManage && (
                    <Td>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" aria-label="Edit user" onClick={() => setEditing(user)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Reset password" onClick={() => setResetting(user)}>
                          <KeyRound className="h-4 w-4" />
                        </Button>
                        {user.id !== session?.id && (
                          <Button
                            variant="ghost"
                            size="icon"
                            aria-label={user.isActive ? 'Deactivate' : 'Reactivate'}
                            onClick={() => update.mutate({ id: user.id, isActive: !user.isActive })}
                          >
                            {user.isActive ? <UserX className="h-4 w-4 text-danger" /> : <UserCheck className="h-4 w-4 text-success" />}
                          </Button>
                        )}
                      </div>
                    </Td>
                  )}
                </Tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
        </>
      )}
      <UserFormModal user={editing} onClose={() => setEditing(null)} isSelf={editing !== 'new' && editing?.id === session?.id} />
      <ResetPasswordModal user={resetting} onClose={() => setResetting(null)} />
    </Card>
  );
}

const userSchema = z.object({
  email: z.string().trim().email('Enter a valid email'),
  firstName: z.string().trim().min(1, 'Required'),
  lastName: z.string().trim().min(1, 'Required'),
  jobTitle: z.string().optional(),
  role: z.enum(ORG_ROLES),
  hourlyRate: z.string().optional(),
  password: z.string().optional(),
});
type UserValues = z.infer<typeof userSchema>;

function UserFormModal({ user, onClose, isSelf }: { user: User | 'new' | null; onClose: () => void; isSelf: boolean }) {
  const isNew = user === 'new';
  const existing = user && user !== 'new' ? user : null;
  const create = useCreateUser();
  const update = useUpdateUser();
  const minPasswordLength = usePasswordMinLength();
  const form = useForm<UserValues>({ resolver: zodResolver(userSchema) });
  const { errors } = form.formState;

  useEffect(() => {
    if (!user) return;
    form.reset({
      email: existing?.email ?? '',
      firstName: existing?.firstName ?? '',
      lastName: existing?.lastName ?? '',
      jobTitle: existing?.jobTitle ?? '',
      role: existing?.role ?? 'MEMBER',
      hourlyRate: existing?.hourlyRate?.toString() ?? '',
      password: '',
    });
  }, [user, existing, form]);

  const onSubmit = form.handleSubmit((values) => {
    const base = {
      firstName: values.firstName,
      lastName: values.lastName,
      jobTitle: values.jobTitle || null,
      hourlyRate: values.hourlyRate ? Number(values.hourlyRate) : null,
    };
    if (isNew) {
      const parsed = passwordSchema(minPasswordLength).safeParse(values.password ?? '');
      if (!parsed.success) return form.setError('password', { message: parsed.error.issues[0]?.message });
      create.mutate({ ...base, email: values.email, role: values.role, password: parsed.data }, { onSuccess: onClose });
    } else if (existing) {
      update.mutate({ id: existing.id, ...base, ...(isSelf ? {} : { role: values.role }) }, { onSuccess: onClose });
    }
  });

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      title={isNew ? 'Add user' : 'Edit user'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={onSubmit} loading={create.isPending || update.isPending}>
            Save
          </Button>
        </>
      }
    >
      <form onSubmit={onSubmit} className="grid gap-4 sm:grid-cols-2">
        <Field label="First name" required error={errors.firstName?.message}>
          <Input {...form.register('firstName')} />
        </Field>
        <Field label="Last name" required error={errors.lastName?.message}>
          <Input {...form.register('lastName')} />
        </Field>
        <Field label="Email" required error={errors.email?.message} className="sm:col-span-2">
          <Input type="email" disabled={!isNew} {...form.register('email')} />
        </Field>
        <Field label="Role" hint={isSelf ? 'You cannot change your own role' : undefined}>
          <Select disabled={isSelf} {...form.register('role')}>
            {ORG_ROLES.map((r) => (
              <option key={r} value={r}>
                {humanize(r)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Hourly rate">
          <Input type="number" min={0} step="0.01" {...form.register('hourlyRate')} />
        </Field>
        <Field label="Job title" className="sm:col-span-2">
          <Input {...form.register('jobTitle')} />
        </Field>
        {isNew && (
          <Field label="Initial password" required error={errors.password?.message} hint="Share it securely; the user can change it from their profile." className="sm:col-span-2">
            <Input type="password" autoComplete="new-password" {...form.register('password')} />
          </Field>
        )}
      </form>
    </Modal>
  );
}

function ResetPasswordModal({ user, onClose }: { user: User | null; onClose: () => void }) {
  const reset = useResetPassword();
  const minPasswordLength = usePasswordMinLength();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    setPassword('');
    setError('');
  }, [user]);

  const submit = () => {
    const parsed = passwordSchema(minPasswordLength).safeParse(password);
    if (!parsed.success) return setError(parsed.error.issues[0]?.message ?? 'Invalid password');
    if (user) reset.mutate({ id: user.id, password }, { onSuccess: onClose });
  };

  return (
    <Modal
      open={!!user}
      onClose={onClose}
      size="sm"
      title="Reset password"
      description={user ? `Set a new password for ${fullName(user)}. They will be signed out of all sessions.` : undefined}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={reset.isPending}>
            Reset password
          </Button>
        </>
      }
    >
      <Field label="New password" error={error}>
        <Input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} />
      </Field>
    </Modal>
  );
}

/** Password policy published by the API (the API validates again on submit). */
function usePasswordMinLength(): number {
  const { data } = useAuthConfig();
  return data?.passwordPolicy.minLength ?? 1;
}
