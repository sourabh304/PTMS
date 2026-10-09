'use client';

import { Building2, Plus, ShieldAlert } from 'lucide-react';
import { useState } from 'react';
import { useSession } from '@/features/auth/api';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, fullName } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardHeader } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useWorkspaces } from '../api';
import { WorkspaceFormModal } from './workspace-form-modal';

/** Root administrator only: every workspace on this installation, and creating new ones. */
export function WorkspaceList() {
  const { data: session } = useSession();
  const isRoot = !!session?.isRootAdmin;
  const { data, isLoading, isError, error, refetch } = useWorkspaces(isRoot);
  const [creating, setCreating] = useState(false);

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
        description="Each workspace is a separate company or team with its own people, projects and settings. Only you can create them."
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
              <Th>Owner</Th>
              <Th className="text-right">People</Th>
              <Th className="text-right">Projects</Th>
              <Th>Created</Th>
            </tr>
          </thead>
          <tbody>
            {data.map((workspace) => (
              <Tr key={workspace.id}>
                <Td>
                  <span className="flex items-center gap-2 font-medium">
                    {workspace.name}
                    {workspace.id === session.organization.id && <Badge tone="brand">Yours</Badge>}
                  </span>
                </Td>
                <Td>
                  {workspace.owners.length ? (
                    <div className="space-y-1.5">
                      {workspace.owners.map((owner) => (
                        <div key={owner.id} className="flex items-center gap-2">
                          <Avatar user={owner} size="xs" />
                          <span>
                            {fullName(owner)} <span className="text-xs text-muted">{owner.email}</span>
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
              </Tr>
            ))}
          </tbody>
        </Table>
      )}
      <WorkspaceFormModal open={creating} onClose={() => setCreating(false)} />
    </Card>
  );
}
