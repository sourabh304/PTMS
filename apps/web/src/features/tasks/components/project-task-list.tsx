'use client';

import { ChevronDown, ChevronRight, FolderPlus, ListChecks, Pencil, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useProject, useProjectMembers } from '@/features/projects/api';
import { useDeleteTaskList, useSaveTaskList, useTaskLists, type TaskList } from '@/features/task-lists/api';
import { appConfig } from '@/shared/config/env';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input } from '@/shared/ui/form';
import { ConfirmDialog, Modal } from '@/shared/ui/modal';
import { useTasks } from '../api';
import type { Task } from '../types';
import { TaskDetailDrawer } from './task-detail-drawer';
import { EMPTY_TASK_FILTERS, filtersToQuery, TaskFilters } from './task-filters';
import { TaskFormModal, type TaskFormDefaults } from './task-form-modal';
import { TaskTable } from './task-table';

const UNGROUPED = '__ungrouped__';

/** Project task list view, grouped by task list (Zoho-style). */
export function ProjectTaskList({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  const { data: taskLists } = useTaskLists(projectId);
  const [filters, setFilters] = useState(EMPTY_TASK_FILTERS);
  const search = useDebounce(filters.search);
  const [taskId, setTaskId] = useQueryParam('taskId');
  const [creating, setCreating] = useState<TaskFormDefaults | null>(null);
  const [editingList, setEditingList] = useState<Partial<TaskList> | null>(null);
  const [deletingList, setDeletingList] = useState<TaskList | null>(null);
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const deleteList = useDeleteTaskList(projectId);
  const canEdit = !!project?.access.canEdit && !project.isArchived;

  const { data, isLoading, isError, error, refetch } = useTasks({
    projectId,
    rootOnly: true,
    limit: appConfig.boardPageSize,
    sortBy: 'position',
    ...filtersToQuery(filters, search),
  });

  const groups = useMemo(() => {
    const byList = new Map<string, Task[]>();
    (data?.data ?? []).forEach((task) => {
      const key = task.taskListId ?? UNGROUPED;
      byList.set(key, [...(byList.get(key) ?? []), task]);
    });
    const ordered = (taskLists ?? []).map((list) => ({ list, tasks: byList.get(list.id) ?? [] }));
    const ungrouped = byList.get(UNGROUPED) ?? [];
    return { ordered, ungrouped };
  }, [data, taskLists]);

  const toggle = (id: string) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <TaskFilters value={filters} onChange={setFilters} members={members?.map((m) => m.user)} />
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => setEditingList({})}>
              <FolderPlus className="h-4 w-4" /> New task list
            </Button>
            <Button onClick={() => setCreating({})}>
              <Plus className="h-4 w-4" /> New task
            </Button>
          </div>
        )}
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : !data?.data.length && !taskLists?.length ? (
        <Card>
          <EmptyState
            icon={<ListChecks className="h-6 w-6" />}
            title="No tasks found"
            description="Create a task list to organize work, or add tasks directly."
            action={canEdit && <Button onClick={() => setCreating({})}>New task</Button>}
          />
        </Card>
      ) : (
        <>
          {groups.ordered.map(({ list, tasks }) => (
            <Card key={list.id}>
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <button type="button" onClick={() => toggle(list.id)} className="flex items-center gap-2 text-sm font-semibold">
                  {collapsed.has(list.id) ? <ChevronRight className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                  {list.name}
                  <span className="rounded-full bg-surface-muted px-2 text-xs font-medium text-muted">{tasks.length}</span>
                  {list.milestone && <span className="text-xs font-normal text-muted">⚑ {list.milestone.name}</span>}
                </button>
                {canEdit && (
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => setCreating({ taskListId: list.id, milestoneId: list.milestoneId ?? undefined })}>
                      <Plus className="h-3.5 w-3.5" /> Task
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Rename list" onClick={() => setEditingList(list)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete list" onClick={() => setDeletingList(list)}>
                      <Trash2 className="h-3.5 w-3.5 text-danger" />
                    </Button>
                  </div>
                )}
              </div>
              {!collapsed.has(list.id) &&
                (tasks.length ? (
                  <TaskTable tasks={tasks} onOpen={(t) => setTaskId(t.id)} />
                ) : (
                  <p className="px-4 py-4 text-sm text-muted">No matching tasks in this list.</p>
                ))}
            </Card>
          ))}
          {groups.ungrouped.length > 0 && (
            <Card>
              <div className="border-b border-border px-4 py-3 text-sm font-semibold">
                General tasks <span className="rounded-full bg-surface-muted px-2 text-xs font-medium text-muted">{groups.ungrouped.length}</span>
              </div>
              <TaskTable tasks={groups.ungrouped} onOpen={(t) => setTaskId(t.id)} />
            </Card>
          )}
        </>
      )}

      <TaskFormModal open={!!creating} onClose={() => setCreating(null)} projectId={projectId} defaults={creating ?? undefined} />
      <TaskDetailDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenTask={setTaskId} />
      <TaskListModal projectId={projectId} list={editingList} onClose={() => setEditingList(null)} />
      <ConfirmDialog
        open={!!deletingList}
        onClose={() => setDeletingList(null)}
        title="Delete task list"
        message={`Delete "${deletingList?.name}"? Its tasks will be kept as general tasks.`}
        loading={deleteList.isPending}
        onConfirm={() => deletingList && deleteList.mutate(deletingList.id, { onSuccess: () => setDeletingList(null) })}
      />
    </div>
  );
}

function TaskListModal({ projectId, list, onClose }: { projectId: string; list: Partial<TaskList> | null; onClose: () => void }) {
  const save = useSaveTaskList(projectId);
  const [name, setName] = useState('');
  const open = !!list;
  const [lastList, setLastList] = useState(list);
  if (list !== lastList) {
    setLastList(list);
    setName(list?.name ?? '');
  }

  const submit = () => name.trim() && save.mutate({ id: list?.id, name: name.trim() }, { onSuccess: onClose });

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title={list?.id ? 'Rename task list' : 'New task list'}
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending} disabled={!name.trim()}>
            Save
          </Button>
        </>
      }
    >
      <Field label="Name">
        <Input autoFocus value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submit()} />
      </Field>
    </Modal>
  );
}
