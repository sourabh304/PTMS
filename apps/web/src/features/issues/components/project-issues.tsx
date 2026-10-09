'use client';

import { Bug, Plus, Search } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { useProject, useProjectMembers } from '@/features/projects/api';
import { appConfig } from '@/shared/config/env';
import { LookupType } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { useQueryParam } from '@/shared/hooks/use-query-param';
import { errorMessage } from '@/shared/lib/api-client';
import { fullName } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Field, Input, Select, Textarea } from '@/shared/ui/form';
import { Pagination } from '@/shared/ui/layout';
import { Modal } from '@/shared/ui/modal';
import { useIssues, useSaveIssue } from '../api';
import { IssueDrawer } from './issue-drawer';
import { IssueTable } from './issue-table';

export function ProjectIssues({ projectId }: { projectId: string }) {
  const { data: project } = useProject(projectId);
  const { data: members } = useProjectMembers(projectId);
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('');
  const [severityId, setSeverityId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [page, setPage] = useState(1);
  const [creating, setCreating] = useState(false);
  const [issueId, setIssueId] = useQueryParam('issueId');
  const debounced = useDebounce(search);
  const canEdit = !!project?.access.canEdit && !project.isArchived;

  useEffect(() => setPage(1), [debounced, statusId, severityId, assigneeId]);

  const { data, isLoading, isError, error, refetch } = useIssues({
    projectId,
    search: debounced || undefined,
    statusId: statusId || undefined,
    severityId: severityId || undefined,
    assigneeId: assigneeId || undefined,
    page,
    limit: appConfig.defaultPageSize,
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <Input className="pl-9" placeholder="Search issues" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <LookupSelect type={LookupType.ISSUE_STATUS} emptyLabel="All statuses" className="w-40" value={statusId} onChange={(e) => setStatusId(e.target.value)} />
          <LookupSelect type={LookupType.ISSUE_SEVERITY} emptyLabel="All severities" className="w-40" value={severityId} onChange={(e) => setSeverityId(e.target.value)} />
          <Select className="w-44" value={assigneeId} onChange={(e) => setAssigneeId(e.target.value)}>
            <option value="">Any assignee</option>
            {members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {fullName(m.user)}
              </option>
            ))}
          </Select>
        </div>
        {canEdit && (
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Report issue
          </Button>
        )}
      </div>

      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : !data?.data.length ? (
          <EmptyState icon={<Bug className="h-6 w-6" />} title="No issues found" description="Bugs and defects reported for this project appear here." />
        ) : (
          <>
            <IssueTable issues={data.data} onOpen={(issue) => setIssueId(issue.id)} />
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
          </>
        )}
      </Card>

      <ReportIssueModal projectId={projectId} open={creating} onClose={() => setCreating(false)} />
      <IssueDrawer issueId={issueId} onClose={() => setIssueId(null)} />
    </div>
  );
}

function ReportIssueModal({ projectId, open, onClose }: { projectId: string; open: boolean; onClose: () => void }) {
  const save = useSaveIssue();
  const { data: members } = useProjectMembers(projectId);
  const empty = { title: '', description: '', severityId: '', priorityId: '', assigneeId: '', dueDate: '' };
  const [values, setValues] = useState(empty);
  useEffect(() => {
    if (open) setValues(empty);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);
  const set = (key: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: e.target.value }));

  const submit = () => {
    if (!values.title.trim()) return toast.error('Title is required');
    save.mutate(
      {
        projectId,
        title: values.title.trim(),
        description: values.description || undefined,
        severityId: values.severityId || undefined,
        priorityId: values.priorityId || undefined,
        assigneeId: values.assigneeId || undefined,
        dueDate: values.dueDate || undefined,
      },
      {
        onSuccess: () => {
          toast.success('Issue reported');
          onClose();
        },
      },
    );
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="Report an issue"
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={submit} loading={save.isPending}>
            Report issue
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Title" required className="sm:col-span-2">
          <Input autoFocus value={values.title} onChange={set('title')} />
        </Field>
        <Field label="Description" className="sm:col-span-2">
          <Textarea rows={5} placeholder="Steps to reproduce, expected vs actual behaviour…" value={values.description} onChange={set('description')} />
        </Field>
        <Field label="Severity">
          <LookupSelect type={LookupType.ISSUE_SEVERITY} emptyLabel="Default" value={values.severityId} onChange={set('severityId')} />
        </Field>
        <Field label="Priority">
          <LookupSelect type={LookupType.PRIORITY} emptyLabel="Default" value={values.priorityId} onChange={set('priorityId')} />
        </Field>
        <Field label="Assignee">
          <Select value={values.assigneeId} onChange={set('assigneeId')}>
            <option value="">Unassigned</option>
            {members?.map((m) => (
              <option key={m.userId} value={m.userId}>
                {fullName(m.user)}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Due date">
          <Input type="date" value={values.dueDate} onChange={set('dueDate')} />
        </Field>
      </div>
    </Modal>
  );
}
