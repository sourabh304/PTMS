'use client';

import { Archive, ArchiveRestore, CheckCircle2, MoreHorizontal, RotateCcw, Settings, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLookups } from '@/features/lookups/api';
import { routes } from '@/shared/config/routes';
import { LookupType, StatusCategory } from '@/shared/constants/domain';
import { Button } from '@/shared/ui/button';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/shared/ui/dropdown';
import { Field, Input } from '@/shared/ui/form';
import { ConfirmDialog } from '@/shared/ui/modal';
import { useDeleteProject, useUpdateProject } from '../api';
import type { ProjectDetail } from '../types';

/** Coordinator actions on a project: mark it completed or reopen it, archive or restore it, delete it. */
export function ProjectActionsMenu({ project }: { project: ProjectDetail }) {
  const router = useRouter();
  const { data: statuses } = useLookups(LookupType.PROJECT_STATUS);
  const update = useUpdateProject(project.id);
  const remove = useDeleteProject();
  const [deleting, setDeleting] = useState(false);
  const [confirmKey, setConfirmKey] = useState('');

  const completed = project.status.category === StatusCategory.CLOSED;
  const doneStatus = statuses?.find((status) => status.category === StatusCategory.CLOSED);
  // Reopening returns the project to its working status (in progress, else the default one).
  const openStatus =
    statuses?.find((status) => status.category === StatusCategory.IN_PROGRESS) ?? statuses?.find((status) => status.isDefault) ?? statuses?.[0];
  const nextStatus = completed ? openStatus : doneStatus;

  const closeDelete = () => {
    setDeleting(false);
    setConfirmKey('');
  };

  return (
    <>
      <Dropdown
        trigger={({ toggle, open }) => (
          <Button variant="secondary" size="icon" aria-label="Project actions" aria-expanded={open} onClick={toggle}>
            <MoreHorizontal />
          </Button>
        )}
      >
        {(close) => (
          <>
            {nextStatus && !project.isArchived && (
              <DropdownItem
                onClick={() => {
                  close();
                  update.mutate({ statusId: nextStatus.id });
                }}
              >
                {completed ? <RotateCcw /> : <CheckCircle2 />}
                {completed ? 'Reopen project' : 'Mark as completed'}
              </DropdownItem>
            )}
            <DropdownItem
              onClick={() => {
                close();
                update.mutate({ isArchived: !project.isArchived });
              }}
            >
              {project.isArchived ? <ArchiveRestore /> : <Archive />}
              {project.isArchived ? 'Restore project' : 'Archive project'}
            </DropdownItem>
            <DropdownItem
              onClick={() => {
                close();
                router.push(routes.projectSettings(project.id));
              }}
            >
              <Settings /> Project settings
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem
              danger
              onClick={() => {
                close();
                setDeleting(true);
              }}
            >
              <Trash2 /> Delete project
            </DropdownItem>
          </>
        )}
      </Dropdown>
      <ConfirmDialog
        open={deleting}
        onClose={closeDelete}
        title="Delete project"
        message={`This permanently deletes ${project.name} with all of its tasks, issues, milestones, meetings and time entries.`}
        confirmLabel="Delete forever"
        loading={remove.isPending}
        onConfirm={() => confirmKey === project.key && remove.mutate(project.id, { onSuccess: () => router.replace(routes.projects) })}
      >
        <Field label={`Type ${project.key} to confirm`}>
          <Input value={confirmKey} onChange={(e) => setConfirmKey(e.target.value.toUpperCase())} />
        </Field>
      </ConfirmDialog>
    </>
  );
}
