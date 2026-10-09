'use client';

import { Building2, Plus, RotateCcw, ShieldAlert, Trash2 } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/features/auth/api';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, fullName } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { ConfirmDialog } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useDeleteWorkspace, useRestoreWorkspace, useWorkspaces } from '../api';
import type { Workspace } from '../types';
import { WorkspaceFormModal } from './workspace-form-modal';

/** Root administrator only: every workspace on this installation, and creating new ones. */
export function WorkspaceList() {
  const { data: session } = useSession();
  const isRoot = !!session?.isRootAdmin;
  const { data, isLoading, isError, error, refetch } = useWorkspaces(isRoot);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Workspace | null>(null);
  const remove = useDeleteWorkspace();
  const restore = useRestoreWorkspace();

  if (session && !isRoot) {
    return (
      <Card>
        <EmptyState icon={<ShieldAlert className="h-6 w-6" />} title="Root administrator only" description="Only the root administrator can see and create workspaces." />
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader
        title="Workspaces"
        description="Each workspace is a separate company or team with its own people, projects and settings. Only you can create, delete and restore them."
        actions={
          <Button size="sm" onClick={() => setCreating(true)}>
            <Plus className="h-3.5 w-3.5" /> New workspace
          </Button>
        }
      />
      {isLoading || !session ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : !data?.length ? (
        <EmptyState icon={<Building2 className="h-6 w-6" />} title="No workspaces yet" />
      ) : (
        <Table>
          <thead>
            <tr>
              <Th>Workspace</Th>
              <Th>Admins</Th>
              <Th className="text-right">People</Th>
              <Th className="text-right">Projects</Th>
              <Th>Created</Th>
              <Th>Status</Th>
              <Th className="w-28" />
            </tr>
          </thead>
          <tbody>
            {data.map((workspace) => (
              <Tr key={workspace.id} className={workspace.deletedAt ? 'opacity-60' : undefined}>
                <Td>
                  <span className="flex items-center gap-2 font-medium">
                    {workspace.name}
                    {workspace.id === session.organization.id && <Badge tone="brand">Yours</Badge>}
                  </span>
                </Td>
                <Td>
                  {workspace.admins.length ? (
                    <div className="space-y-1.5">
                      {workspace.admins.map((admin) => (
                        <div key={admin.id} className="flex items-center gap-2">
                          <Avatar user={admin} size="xs" />
                          <span>
                            {fullName(admin)} <span className="text-xs text-muted">{admin.email}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span className="text-muted">—</span>
                  )}
                </Td>
                <Td className="text-right tabular-nums">{workspace.userCount}</Td>
                <Td className="text-right tabular-nums">{workspace.projectCount}</Td>
                <Td className="whitespace-nowrap text-muted">{formatDate(workspace.createdAt)}</Td>
                <Td>{workspace.deletedAt ? <Badge tone="danger">Deleted</Badge> : <Badge tone="success">Active</Badge>}</Td>
                <Td className="text-right">
                  {workspace.id === session.organization.id ? null : workspace.deletedAt ? (
                    <Button variant="secondary" size="sm" onClick={() => restore.mutate(workspace.id)} loading={restore.isPending && restore.variables === workspace.id}>
                      <RotateCcw className="h-3.5 w-3.5" /> Restore
                    </Button>
                  ) : (
                    <Button variant="ghost" size="sm" className="text-danger" onClick={() => setDeleting(workspace)}>
                      <Trash2 className="h-3.5 w-3.5" /> Delete
                    </Button>
                  )}
                </Td>
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <WorkspaceFormModal open={creating} onClose={() => setCreating(false)} />
      <ConfirmDialog
        open={!!deleting}
        title="Delete workspace"
        message={`${deleting?.name ?? ''} will be switched off: its ${deleting?.userCount ?? 0} people are signed out and cannot sign in. Nothing is erased, and you can restore it at any time.`}
        confirmLabel="Delete workspace"
        loading={remove.isPending}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        onClose={() => setDeleting(null)}
      />
    </Card>
  );
}
