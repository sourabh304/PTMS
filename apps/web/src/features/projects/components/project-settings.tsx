'use client';

import { Archive, ArchiveRestore, Pencil, Trash2, UserPlus } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useActiveUsers } from '@/features/users/api';
import { UserMultiSelect } from '@/features/users/components/user-multi-select';
import { routes } from '@/shared/config/routes';
import { PROJECT_ROLES, type ProjectRole } from '@/shared/constants/domain';
import { formatDate, fullName, humanize } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card, CardBody, CardHeader } from '@/shared/ui/card';
import { Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select } from '@/shared/ui/form';
import { ConfirmDialog, Modal } from '@/shared/ui/modal';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useAddMembers, useDeleteProject, useProject, useProjectMembers, useRemoveMember, useUpdateMember, useUpdateProject } from '../api';
import { ProjectFormModal } from './project-form-modal';

export function ProjectSettings({ projectId }: { projectId: string }) {
  const router = useRouter();
  const { data: project } = useProject(projectId);
  const { data: members, isLoading } = useProjectMembers(projectId);
  const updateProject = useUpdateProject(projectId);
  const deleteProject = useDeleteProject();
  const updateMember = useUpdateMember(projectId);
  const removeMember = useRemoveMember(projectId);
  const [editing, setEditing] = useState(false);
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [confirmKey, setConfirmKey] = useState('');

  if (!project) return <Spinner />;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader
          title="Project details"
          actions={
            <Button variant="secondary" size="sm" onClick={() => setEditing(true)}>
              <Pencil className="size-3.5" /> Edit
            </Button>
          }
        />
        <CardBody>
          <dl className="grid gap-4 text-sm sm:grid-cols-3">
            <Detail label="Key" value={project.key} />
            <Detail label="Owner" value={fullName(project.owner)} />
            <Detail label="Budget" value={project.budgetHours ? `${project.budgetHours} hours` : '—'} />
            <Detail label="Start" value={formatDate(project.startDate)} />
            <Detail label="End" value={formatDate(project.endDate)} />
            <Detail label="Created" value={formatDate(project.createdAt)} />
            <div className="sm:col-span-3">
              <Detail label="Description" value={project.description || '—'} />
            </div>
          </dl>
        </CardBody>
      </Card>

      <Card>
        <CardHeader
          title="Members"
          description="Managers can edit the project; members can work on tasks; viewers have read-only access."
          actions={
            <Button size="sm" onClick={() => setAdding(true)}>
              <UserPlus className="size-3.5" /> Add members
            </Button>
          }
        />
        {isLoading ? (
          <Spinner />
        ) : (
          <Table>
            <thead>
              <tr>
                <Th>Member</Th>
                <Th>Role</Th>
                <Th>Joined</Th>
                <Th className="w-16" />
              </tr>
            </thead>
            <tbody>
              {members?.map((member) => {
                const isOwner = member.userId === project.ownerId;
                return (
                  <Tr key={member.id}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar user={member.user} />
                        <div>
                          <p className="font-medium">
                            {fullName(member.user)} {isOwner && <Badge tone="brand">Owner</Badge>}
                          </p>
                          <p className="text-xs text-muted">{member.user.jobTitle ?? member.user.email}</p>
                        </div>
                      </div>
                    </Td>
                    <Td>
                      <Select
                        className="w-36"
                        value={member.role}
                        disabled={isOwner}
                        onChange={(event) => updateMember.mutate({ userId: member.userId, role: event.target.value as ProjectRole })}
                      >
                        {PROJECT_ROLES.map((role) => (
                          <option key={role} value={role}>
                            {humanize(role)}
                          </option>
                        ))}
                      </Select>
                    </Td>
                    <Td className="text-muted">{formatDate(member.createdAt)}</Td>
                    <Td>
                      {!isOwner && (
                        <Button variant="ghost" size="icon" aria-label="Remove member" onClick={() => removeMember.mutate(member.userId)}>
                          <Trash2 className="size-4 text-danger" />
                        </Button>
                      )}
                    </Td>
                  </Tr>
                );
              })}
            </tbody>
          </Table>
        )}
      </Card>

      <Card className="border-danger/30">
        <CardHeader title="Danger zone" />
        <CardBody className="flex flex-wrap gap-3">
          <Button variant="secondary" loading={updateProject.isPending} onClick={() => updateProject.mutate({ isArchived: !project.isArchived })}>
            {project.isArchived ? <ArchiveRestore className="size-4" /> : <Archive className="size-4" />}
            {project.isArchived ? 'Restore project' : 'Archive project'}
          </Button>
          <Button variant="danger" onClick={() => setDeleting(true)}>
            <Trash2 className="size-4" /> Delete project
          </Button>
        </CardBody>
      </Card>

      <ProjectFormModal open={editing} onClose={() => setEditing(false)} project={project} />
      <AddMembersModal projectId={projectId} open={adding} onClose={() => setAdding(false)} existingIds={members?.map((m) => m.userId) ?? []} />
      <ConfirmDialog
        open={deleting}
        onClose={() => setDeleting(false)}
        title="Delete project"
        message={`This permanently deletes ${project.name} with all of its tasks, issues, milestones and time entries.`}
        confirmLabel="Delete forever"
        loading={deleteProject.isPending}
        onConfirm={() =>
          confirmKey === project.key &&
          deleteProject.mutate(project.id, { onSuccess: () => router.replace(routes.projects) })
        }
      >
        <Field label={`Type ${project.key} to confirm`}>
          <Input value={confirmKey} onChange={(e) => setConfirmKey(e.target.value.toUpperCase())} />
        </Field>
      </ConfirmDialog>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted">{label}</dt>
      <dd className="mt-0.5 whitespace-pre-wrap">{value}</dd>
    </div>
  );
}

function AddMembersModal({ projectId, open, onClose, existingIds }: { projectId: string; open: boolean; onClose: () => void; existingIds: string[] }) {
  const { data: users } = useActiveUsers();
  const addMembers = useAddMembers(projectId);
  const [selected, setSelected] = useState<string[]>([]);
  const [role, setRole] = useState<ProjectRole>(PROJECT_ROLES[1]);
  const candidates = useMemo(() => (users?.data ?? []).filter((u) => !existingIds.includes(u.id)), [users, existingIds]);

  const close = () => {
    setSelected([]);
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={close}
      title="Add members"
      footer={
        <>
          <Button variant="secondary" onClick={close}>
            Cancel
          </Button>
          <Button disabled={!selected.length} loading={addMembers.isPending} onClick={() => addMembers.mutate({ userIds: selected, role }, { onSuccess: close })}>
            Add {selected.length || ''}
          </Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field label="People">
          <UserMultiSelect options={candidates} value={selected} onChange={setSelected} placeholder="Choose people to add" />
        </Field>
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value as ProjectRole)}>
            {PROJECT_ROLES.map((r) => (
              <option key={r} value={r}>
                {humanize(r)}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
