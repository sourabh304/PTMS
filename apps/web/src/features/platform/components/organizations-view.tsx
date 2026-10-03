'use client';

import { Building2, CreditCard, Pause, Play, Plus, Search, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { SubscriptionFormModal } from '@/features/subscriptions/components/subscription-form-modal';
import { SubscriptionStatusBadge } from '@/features/subscriptions/components/subscription-status-badge';
import { appConfig } from '@/shared/config/env';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, formatDateTime, fullName } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, FormAlert, Input } from '@/shared/ui/form';
import { PageHeader, Pagination, ProgressBar, Segmented, Toolbar } from '@/shared/ui/layout';
import { ConfirmDialog, Drawer, Modal } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import {
  useCreateOrganization,
  useDeletePlatformOrganization,
  usePlatformOrganization,
  usePlatformOrganizations,
  useUpdatePlatformOrganization,
} from '../api';
import type { PlatformOrganizationDetail } from '../types';

type StatusFilter = 'all' | 'active' | 'suspended';

export function OrganizationsView() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [orgId, setOrgId] = useQueryParam('org');
  const debounced = useDebounce(search);

  useEffect(() => setPage(1), [debounced, status]);

  const { data, isLoading, isError, error, refetch } = usePlatformOrganizations({
    search: debounced || undefined,
    status: status === 'all' ? undefined : status,
    page,
    limit: appConfig.defaultPageSize,
  });

  return (
    <>
      <PageHeader
        title="Organizations"
        description="Every tenant on the platform, their plan and their usage."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus /> New organization
          </Button>
        }
      />
      <Toolbar>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search name or slug" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Segmented<StatusFilter>
          value={status}
          onChange={setStatus}
          options={[
            { value: 'all', label: 'All' },
            { value: 'active', label: 'Active' },
            { value: 'suspended', label: 'Suspended' },
          ]}
        />
      </Toolbar>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : !data?.data.length ? (
          <EmptyState icon={<Building2 />} title="No organizations found" />
        ) : (
          <>
            <Table>
              <thead>
                <tr>
                  <Th>Organization</Th>
                  <Th>Plan</Th>
                  <Th className="text-right">Users</Th>
                  <Th className="text-right">Projects</Th>
                  <Th>Status</Th>
                  <Th>Created</Th>
                </tr>
              </thead>
              <tbody>
                {data.data.map((org) => {
                  const plan = org.currentSubscription?.plan;
                  return (
                    <Tr key={org.id} className="cursor-pointer" onClick={() => setOrgId(org.id)}>
                      <Td>
                        <p className="font-medium text-foreground">{org.name}</p>
                        <p className="font-mono text-xs text-muted">{org.slug}</p>
                      </Td>
                      <Td>
                        {plan ? (
                          <span className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{plan.name}</span>
                            <SubscriptionStatusBadge status={org.currentSubscription!.status} />
                          </span>
                        ) : (
                          <span className="text-xs text-muted">No plan</span>
                        )}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {org._count.users}
                        {plan?.maxUsers ? <span className="text-muted"> / {plan.maxUsers}</span> : null}
                      </Td>
                      <Td className="text-right tabular-nums">
                        {org._count.projects}
                        {plan?.maxProjects ? <span className="text-muted"> / {plan.maxProjects}</span> : null}
                      </Td>
                      <Td>{org.isActive ? <Badge tone="success">Active</Badge> : <Badge tone="danger">Suspended</Badge>}</Td>
                      <Td className="whitespace-nowrap text-muted">{formatDate(org.createdAt)}</Td>
                    </Tr>
                  );
                })}
              </tbody>
            </Table>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} itemLabel="organizations" onPageChange={setPage} />
          </>
        )}
      </Card>

      <CreateOrganizationModal open={creating} onClose={() => setCreating(false)} onCreated={setOrgId} />
      <OrganizationDrawer organizationId={orgId} onClose={() => setOrgId(null)} />
    </>
  );
}

// ─── Details drawer ─────────────────────────────────────────────

function OrganizationDrawer({ organizationId, onClose }: { organizationId: string | null; onClose: () => void }) {
  const { data: org, isLoading, isError, error } = usePlatformOrganization(organizationId);
  return (
    <Drawer open={!!organizationId} onClose={onClose} title={org?.name ?? 'Organization'} description={org && <span className="font-mono">{org.slug}</span>}>
      {isLoading ? <Spinner /> : isError || !org ? <ErrorState message={errorMessage(error, 'Organization not found')} /> : <OrganizationDetails key={org.id} org={org} onDeleted={onClose} />}
    </Drawer>
  );
}

function OrganizationDetails({ org, onDeleted }: { org: PlatformOrganizationDetail; onDeleted: () => void }) {
  const update = useUpdatePlatformOrganization();
  const remove = useDeletePlatformOrganization();
  const [name, setName] = useState(org.name);
  const [assigning, setAssigning] = useState(false);
  const [confirm, setConfirm] = useState<'suspend' | 'delete' | null>(null);
  const [slugConfirm, setSlugConfirm] = useState('');
  const plan = org.currentSubscription?.plan;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
        <Field label="Organization name">
          <Input value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Button variant="secondary" disabled={!name.trim() || name === org.name} loading={update.isPending} onClick={() => update.mutate({ id: org.id, name: name.trim() })}>
          Rename
        </Button>
      </section>

      <section className="rounded-ui-lg border border-border p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-sm font-semibold">Subscription</h3>
          <Button size="sm" onClick={() => setAssigning(true)}>
            <CreditCard /> {plan ? 'Change plan' : 'Assign plan'}
          </Button>
        </div>
        {plan ? (
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-base font-semibold text-foreground">{plan.name}</span>
              <SubscriptionStatusBadge status={org.currentSubscription!.status} />
              <span className="text-xs text-muted">
                since {formatDate(org.currentSubscription!.startDate)}
                {org.currentSubscription!.endDate && ` · until ${formatDate(org.currentSubscription!.endDate)}`}
              </span>
            </div>
            <Usage label="Active users" used={org.usage.users} limit={plan.maxUsers} />
            <Usage label="Active projects" used={org.usage.projects} limit={plan.maxProjects} />
          </div>
        ) : (
          <p className="text-sm text-muted">No current plan. Limits are not enforced unless REQUIRE_ACTIVE_SUBSCRIPTION is enabled.</p>
        )}
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold">Super admins</h3>
        <ul className="divide-y divide-border rounded-ui-lg border border-border">
          {org.superAdmins.map((u) => (
            <li key={u.id} className="flex items-center gap-3 px-3 py-2.5">
              <Avatar user={u} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-medium">{fullName(u)}</span>
                <span className="block truncate text-xs text-muted">{u.email}</span>
              </span>
              <span className="hidden text-xs text-muted sm:block">Last sign-in {formatDateTime(u.lastLoginAt)}</span>
            </li>
          ))}
        </ul>
      </section>

      {org.subscriptions.length > 0 && (
        <section>
          <h3 className="mb-2 text-sm font-semibold">Subscription history</h3>
          <ul className="divide-y divide-border rounded-ui-lg border border-border text-sm">
            {org.subscriptions.map((s) => (
              <li key={s.id} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                <span className="font-medium">{s.plan.name}</span>
                <span className="text-xs text-muted">
                  {formatDate(s.startDate)} – {s.endDate ? formatDate(s.endDate) : 'open'}
                </span>
                <SubscriptionStatusBadge status={s.status} />
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="flex flex-wrap gap-2 border-t border-border pt-4">
        {org.isActive ? (
          <Button variant="secondary" onClick={() => setConfirm('suspend')}>
            <Pause /> Suspend organization
          </Button>
        ) : (
          <Button variant="secondary" loading={update.isPending} onClick={() => update.mutate({ id: org.id, isActive: true })}>
            <Play /> Reactivate organization
          </Button>
        )}
        <Button variant="danger-ghost" onClick={() => setConfirm('delete')}>
          <Trash2 /> Delete organization
        </Button>
      </section>

      <SubscriptionFormModal open={assigning} onClose={() => setAssigning(false)} organizationId={org.id} />
      <ConfirmDialog
        open={confirm === 'suspend'}
        onClose={() => setConfirm(null)}
        title="Suspend organization"
        message={`Everyone in ${org.name} will be signed out immediately and unable to sign in until the organization is reactivated. No data is deleted.`}
        confirmLabel="Suspend"
        loading={update.isPending}
        onConfirm={() => update.mutate({ id: org.id, isActive: false }, { onSuccess: () => setConfirm(null) })}
      />
      <ConfirmDialog
        open={confirm === 'delete'}
        onClose={() => setConfirm(null)}
        title="Delete organization"
        message={`This permanently deletes ${org.name} with all of its users, projects, tasks, issues, timesheets and subscriptions.`}
        confirmLabel="Delete forever"
        loading={remove.isPending}
        onConfirm={() => slugConfirm === org.slug && remove.mutate(org.id, { onSuccess: onDeleted })}
      >
        <Field label={`Type ${org.slug} to confirm`}>
          <Input className="font-mono" value={slugConfirm} onChange={(e) => setSlugConfirm(e.target.value.trim())} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}

function Usage({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  const percent = limit ? (used / limit) * 100 : 0;
  return (
    <div>
      <div className="mb-1.5 flex justify-between text-xs">
        <span className="text-muted">{label}</span>
        <span className="font-medium tabular-nums">
          {used} / {limit ?? 'Unlimited'}
        </span>
      </div>
      <ProgressBar value={limit ? percent : 0} color={percent >= 100 ? 'var(--danger)' : percent >= 80 ? 'var(--warning)' : undefined} />
    </div>
  );
}

// ─── Create ─────────────────────────────────────────────────────

const EMPTY_FORM = { name: '', firstName: '', lastName: '', email: '', password: '' };

function CreateOrganizationModal({ open, onClose, onCreated }: { open: boolean; onClose: () => void; onCreated: (id: string) => void }) {
  const create = useCreateOrganization();
  const [values, setValues] = useState(EMPTY_FORM);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      setValues(EMPTY_FORM);
      setError('');
    }
  }, [open]);

  const set = (key: keyof typeof EMPTY_FORM) => (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = () => {
    if (Object.values(values).some((v) => !v.trim())) return setError('All fields are required');
    create.mutate(
      {
        name: values.name.trim(),
        superAdmin: { firstName: values.firstName.trim(), lastName: values.lastName.trim(), email: values.email.trim(), password: values.password },
      },
      {
        onSuccess: (org) => {
          onClose();
          onCreated(org.id);
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New organization"
      description="Creates the workspace with its default workflow and its first Super Admin."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={create.isPending}>
            Create organization
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {error && (
          <div className="sm:col-span-2">
            <FormAlert>{error}</FormAlert>
          </div>
        )}
        <Field label="Organization name" required className="sm:col-span-2">
          <Input autoFocus value={values.name} onChange={set('name')} />
        </Field>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted sm:col-span-2">Super admin</p>
        <Field label="First name" required>
          <Input value={values.firstName} onChange={set('firstName')} />
        </Field>
        <Field label="Last name" required>
          <Input value={values.lastName} onChange={set('lastName')} />
        </Field>
        <Field label="Email" required className="sm:col-span-2">
          <Input type="email" value={values.email} onChange={set('email')} />
        </Field>
        <Field label="Initial password" required hint="Upper and lower case letters and a number; share it securely." className="sm:col-span-2">
          <Input type="password" autoComplete="new-password" value={values.password} onChange={set('password')} />
        </Field>
      </div>
    </Modal>
  );
}
