'use client';

import { AlertCircle, CalendarDays, FolderKanban, LayoutGrid, List, Plus, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { LookupSelect } from '@/features/lookups/components/lookup-select';
import { appConfig } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { LookupType, Permission } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { errorMessage } from '@/shared/lib/api-client';
import { formatDate, fullName } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { ColorBadge } from '@/shared/ui/badge';
import { Button } from '@/shared/ui/button';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Input } from '@/shared/ui/form';
import { PageHeader, Pagination, ProgressBar, Segmented } from '@/shared/ui/layout';
import { Table, Td, Th, Tr } from '@/shared/ui/table';
import { useProjects } from '../api';
import type { Project } from '../types';
import { ProjectFormModal } from './project-form-modal';

type View = 'grid' | 'table';

export function ProjectList() {
  const router = useRouter();
  const { can } = usePermissions();
  const [search, setSearch] = useState('');
  const [statusId, setStatusId] = useState('');
  const [archived, setArchived] = useState(false);
  const [page, setPage] = useState(1);
  const [view, setView] = useState<View>('grid');
  const [creating, setCreating] = useState(false);
  const debouncedSearch = useDebounce(search);

  const { data, isLoading, isError, error, refetch } = useProjects({
    search: debouncedSearch || undefined,
    statusId: statusId || undefined,
    archived,
    page,
    limit: appConfig.defaultPageSize,
  });

  return (
    <>
      <PageHeader
        title="Projects"
        description="Every project you have access to, with live progress."
        actions={
          can(Permission.PROJECTS_CREATE) && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New project
            </Button>
          )
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <Input
            placeholder="Search by name or key"
            className="pl-9"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />
        </div>
        <LookupSelect
          type={LookupType.PROJECT_STATUS}
          emptyLabel="All statuses"
          className="w-44"
          value={statusId}
          onChange={(event) => {
            setStatusId(event.target.value);
            setPage(1);
          }}
        />
        <Segmented
          value={archived ? 'archived' : 'active'}
          onChange={(value) => {
            setArchived(value === 'archived');
            setPage(1);
          }}
          options={[
            { value: 'active', label: 'Active' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
        <div className="ml-auto">
          <Segmented<View>
            value={view}
            onChange={setView}
            options={[
              { value: 'grid', label: <LayoutGrid className="h-3.5 w-3.5" /> },
              { value: 'table', label: <List className="h-3.5 w-3.5" /> },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : isError ? (
        <ErrorState message={errorMessage(error)} onRetry={refetch} />
      ) : !data?.data.length ? (
        <Card>
          <EmptyState
            icon={<FolderKanban className="h-6 w-6" />}
            title={archived ? 'No archived projects' : 'No projects yet'}
            description={archived ? undefined : 'Create your first project to start planning work.'}
            action={
              !archived &&
              can(Permission.PROJECTS_CREATE) && (
                <Button onClick={() => setCreating(true)}>
                  <Plus className="h-4 w-4" /> New project
                </Button>
              )
            }
          />
        </Card>
      ) : (
        <>
          {view === 'grid' ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {data.data.map((project) => (
                <ProjectCard key={project.id} project={project} />
              ))}
            </div>
          ) : (
            <ProjectTable projects={data.data} />
          )}
          {data.meta.totalPages > 1 && (
            <Card className="mt-4">
              <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} onPageChange={setPage} />
            </Card>
          )}
        </>
      )}

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} onSaved={(project) => router.push(routes.project(project.id))} />
    </>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <Link href={routes.project(project.id)} className="group">
      <Card className="h-full overflow-hidden transition group-hover:-translate-y-0.5 group-hover:shadow-md">
        <div className="h-1.5" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
        <div className="space-y-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-muted">{project.key}</p>
              <h3 className="truncate font-semibold group-hover:text-brand">{project.name}</h3>
            </div>
            <ColorBadge color={project.status.color} label={project.status.name} />
          </div>
          {project.description && <p className="line-clamp-2 text-sm text-muted">{project.description}</p>}
          <div>
            <div className="mb-1.5 flex justify-between text-xs">
              <span className="text-muted">
                {project.stats.completedTasks}/{project.stats.totalTasks} tasks
              </span>
              <span className="font-semibold">{project.stats.progress}%</span>
            </div>
            <ProgressBar value={project.stats.progress} color={project.color ?? undefined} />
          </div>
          <div className="flex items-center justify-between text-xs text-muted">
            <div className="flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <Users className="h-3.5 w-3.5" /> {project._count.members}
              </span>
              {project.endDate && (
                <span className="inline-flex items-center gap-1">
                  <CalendarDays className="h-3.5 w-3.5" /> {formatDate(project.endDate)}
                </span>
              )}
              {project.stats.overdueTasks > 0 && (
                <span className="inline-flex items-center gap-1 text-danger">
                  <AlertCircle className="h-3.5 w-3.5" /> {project.stats.overdueTasks} overdue
                </span>
              )}
            </div>
            <Avatar user={project.owner} size="xs" />
          </div>
        </div>
      </Card>
    </Link>
  );
}

function ProjectTable({ projects }: { projects: Project[] }) {
  return (
    <Card>
      <Table>
        <thead>
          <tr>
            <Th>Project</Th>
            <Th>Status</Th>
            <Th>Owner</Th>
            <Th className="w-48">Progress</Th>
            <Th>Overdue</Th>
            <Th>Timeline</Th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <Tr key={project.id}>
              <Td>
                <Link href={routes.project(project.id)} className="flex items-center gap-2 font-medium hover:text-brand">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
                  <span className="text-xs text-muted">{project.key}</span>
                  {project.name}
                </Link>
              </Td>
              <Td>
                <ColorBadge color={project.status.color} label={project.status.name} />
              </Td>
              <Td>
                <span className="flex items-center gap-2">
                  <Avatar user={project.owner} size="xs" /> {fullName(project.owner)}
                </span>
              </Td>
              <Td>
                <div className="flex items-center gap-2">
                  <ProgressBar value={project.stats.progress} />
                  <span className="w-9 text-right text-xs font-medium">{project.stats.progress}%</span>
                </div>
              </Td>
              <Td className={project.stats.overdueTasks ? 'font-medium text-danger' : 'text-muted'}>{project.stats.overdueTasks}</Td>
              <Td className="whitespace-nowrap text-xs text-muted">
                {formatDate(project.startDate)} → {formatDate(project.endDate)}
              </Td>
            </Tr>
          ))}
        </tbody>
      </Table>
    </Card>
  );
}
