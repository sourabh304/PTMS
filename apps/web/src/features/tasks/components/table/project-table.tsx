'use client';

import { ListChecks, Plus } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCustomFields, useDeleteCustomField, useSetCustomValue } from '@/features/custom-fields/api';
import { CustomFieldModal } from '@/features/custom-fields/components/custom-field-modal';
import type { CustomField } from '@/features/custom-fields/types';
import { useLookups } from '@/features/lookups/api';
import { useProject, useProjectMembers } from '@/features/projects/api';
import { FALLBACK_GROUP_COLOR } from '@/features/task-lists/group-colors';
import { useDeleteTaskList, useSaveTaskList, useTaskLists, type TaskList } from '@/features/task-lists/api';
import { appConfig } from '@/shared/config/env';
import { LookupType } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { ConfirmDialog } from '@/shared/ui/modal';
import { useCreateTask, useQuickUpdateTask, useTasks } from '../../api';
import type { Task } from '../../types';
import { TaskDetailDrawer } from '../task-detail-drawer';
import { EMPTY_TASK_FILTERS, filtersToQuery } from '../task-filters';
import { TaskFormModal, type TaskFormDefaults } from '../task-form-modal';
import { TABLE_COLUMNS, tableLayout } from './table-columns';
import { TableGroup, type GroupModel } from './table-group';
import type { RowContext } from './task-row';
import { TableToolbar } from './table-toolbar';
import { useTableView } from './table-view';

const NEW_GROUP_NAME = 'New group';
/** Key of the "Other tasks" bucket in the remembered collapsed groups. */
const UNGROUPED_KEY = 'ungrouped';
const UNGROUPED: GroupModel = { id: null, name: 'Other tasks', color: FALLBACK_GROUP_COLOR, milestoneId: null };

const toGroup = (list: TaskList): GroupModel => ({ id: list.id, name: list.name, color: list.color ?? FALLBACK_GROUP_COLOR, milestoneId: list.milestoneId });

/** The project's main table: tasks in colored groups with inline-editable columns. */
export function ProjectTable({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: memberships } = useProjectMembers(projectId);
  const { data: taskLists } = useTaskLists(projectId);
  const { data: statuses } = useLookups(LookupType.TASK_STATUS);
  const { data: priorities } = useLookups(LookupType.PRIORITY);
  const [filters, setFilters] = useState(EMPTY_TASK_FILTERS);
  const search = useDebounce(filters.search);
  const [taskId, setTaskId] = useQueryParam('taskId');
  const [creating, setCreating] = useState<TaskFormDefaults | null>(null);
  const [deleting, setDeleting] = useState<GroupModel | null>(null);
  const [newGroupId, setNewGroupId] = useState<string | null>(null);
  const [editingColumn, setEditingColumn] = useState<CustomField | 'new' | null>(null);
  const [deletingColumn, setDeletingColumn] = useState<CustomField | null>(null);
  const { data: customFields } = useCustomFields(projectId);
  const setCustom = useSetCustomValue();
  const deleteColumn = useDeleteCustomField(projectId);

  const createTask = useCreateTask();
  const quickUpdate = useQuickUpdateTask();
  const saveGroup = useSaveTaskList(projectId);
  const deleteGroup = useDeleteTaskList(projectId);
  const canEdit = !!project?.access.canEdit && !project.isArchived;
  const canManage = !!project?.access.canManage && !project.isArchived;
  const { view, toggleColumn, showAllColumns, setShowSummary, toggleGroup, setCollapsedGroups } = useTableView(projectId);
  const allFields = useMemo(() => customFields ?? [], [customFields]);
  const fields = useMemo(() => allFields.filter((field) => !view.hiddenColumns.includes(field.id)), [allFields, view.hiddenColumns]);
  const layout = useMemo(() => tableLayout(fields.length, canManage, view.hiddenColumns), [fields.length, canManage, view.hiddenColumns]);
  const members = useMemo(() => (memberships ?? []).map((m) => m.user), [memberships]);

  const { data, isLoading, isError, error, refetch } = useTasks({
    projectId,
    rootOnly: true,
    limit: appConfig.boardPageSize,
    sortBy: 'position',
    ...filtersToQuery(filters, search),
  });

  const groups = useMemo(() => {
    const byGroup = new Map<string | null, Task[]>();
    (data?.data ?? []).forEach((task) => byGroup.set(task.taskListId, [...(byGroup.get(task.taskListId) ?? []), task]));
    const listed = (taskLists ?? []).map((list) => ({ group: toGroup(list), tasks: byGroup.get(list.id) ?? [] }));
    const ungrouped = byGroup.get(null) ?? [];
    return ungrouped.length ? [...listed, { group: UNGROUPED, tasks: ungrouped }] : listed;
  }, [data, taskLists]);

  const context: RowContext = {
    statuses,
    priorities,
    members,
    canEdit,
    canManage,
    layout,
    customFields: fields,
    onSetCustom: (task, field, value) => setCustom.mutate({ taskId: task.id, fieldId: field.id, value }),
    onAddColumn: () => setEditingColumn('new'),
    onEditColumn: setEditingColumn,
    onDeleteColumn: setDeletingColumn,
    onOpen: (task) => setTaskId(task.id),
    onUpdate: (task, input, preview) => quickUpdate.mutate({ id: task.id, input, preview }),
  };

  const addGroup = () =>
    saveGroup.mutate({ name: NEW_GROUP_NAME }, { onSuccess: (group) => setNewGroupId(group.id) });

  const firstGroup = groups.find((g) => g.group.id)?.group;
  const isEmpty = !data?.data.length && !taskLists?.length;

  return (
    <div>
      <TableToolbar
        filters={filters}
        onFiltersChange={setFilters}
        members={members}
        canEdit={canEdit}
        onNewTask={() => setCreating(firstGroup ? { taskListId: firstGroup.id ?? undefined, milestoneId: firstGroup.milestoneId ?? undefined } : {})}
        onNewGroup={addGroup}
        creatingGroup={saveGroup.isPending}
        view={{
          columns: [...TABLE_COLUMNS.map(({ id, label }) => ({ id, label })), ...allFields.map((field) => ({ id: field.id, label: field.name }))],
          hiddenColumns: view.hiddenColumns,
          onToggleColumn: toggleColumn,
          onShowAllColumns: showAllColumns,
          showSummary: view.showSummary,
          onShowSummaryChange: setShowSummary,
          onCollapseAll: () => setCollapsedGroups(groups.map(({ group }) => group.id ?? UNGROUPED_KEY)),
          onExpandAll: () => setCollapsedGroups([]),
          onAddColumn: canManage ? () => setEditingColumn('new') : undefined,
        }}
      />

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : isEmpty ? (
        <EmptyState
          icon={<ListChecks className="size-6" />}
          title="Start planning this project"
          description="Create a group for a phase or team, then add tasks to it."
          action={
            canEdit && (
              <Button onClick={addGroup} loading={saveGroup.isPending}>
                <Plus /> Add a group
              </Button>
            )
          }
        />
      ) : (
        <div className="scrollbar-thin -mx-1 overflow-x-auto px-1 pb-2">
          {groups.map(({ group, tasks }) => {
            const { id } = group;
            return (
              <TableGroup
                key={id ?? 'ungrouped'}
                group={group}
                tasks={tasks}
                context={context}
                autoEditName={id === newGroupId}
                collapsed={view.collapsedGroups.includes(id ?? UNGROUPED_KEY)}
                onToggleCollapsed={() => toggleGroup(id ?? UNGROUPED_KEY)}
                showSummary={view.showSummary}
                onAddTask={(title) => createTask.mutate({ projectId, title, taskListId: id, milestoneId: group.milestoneId })}
                // The "Other tasks" bucket is not a real group, so it cannot be edited.
                onRename={id ? (name) => saveGroup.mutate({ id, name }) : undefined}
                onRecolor={id ? (color) => saveGroup.mutate({ id, color }) : undefined}
                onDelete={id ? () => setDeleting(group) : undefined}
              />
            );
          })}
          {canEdit && (
            <Button variant="ghost" size="sm" onClick={addGroup} loading={saveGroup.isPending} className="text-muted">
              <Plus /> Add new group
            </Button>
          )}
        </div>
      )}

      <TaskFormModal open={!!creating} onClose={() => setCreating(null)} projectId={projectId} defaults={creating ?? undefined} />
      <TaskDetailDrawer taskId={taskId} onClose={() => setTaskId(null)} onOpenTask={setTaskId} />
      <CustomFieldModal projectId={projectId} field={editingColumn} onClose={() => setEditingColumn(null)} />
      <ConfirmDialog
        open={!!deletingColumn}
        onClose={() => setDeletingColumn(null)}
        title="Delete column"
        message={`Delete "${deletingColumn?.name}" and every value in it? This cannot be undone.`}
        loading={deleteColumn.isPending}
        onConfirm={() => deletingColumn && deleteColumn.mutate(deletingColumn.id, { onSuccess: () => setDeletingColumn(null) })}
      />
      <ConfirmDialog
        open={!!deleting}
        onClose={() => setDeleting(null)}
        title="Delete group"
        message={`Delete "${deleting?.name}"? Its tasks are kept and move to "${UNGROUPED.name}".`}
        loading={deleteGroup.isPending}
        onConfirm={() => deleting?.id && deleteGroup.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
      />
    </div>
  );
}
