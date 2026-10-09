'use client';

import { ChevronRight, Search, Users } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { appConfig } from '@/shared/config/env';
import { routes } from '@/shared/config/routes';
import { ORG_ROLES, OrgRole, roleLabel } from '@/shared/constants/domain';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { errorMessage } from '@/shared/lib/api-client';
import { fullName, timeAgo } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Badge } from '@/shared/ui/badge';
import { Card } from '@/shared/ui/card';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { Input, Select } from '@/shared/ui/form';
import { PageHeader, Pagination, Toolbar } from '@/shared/ui/layout';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { Permission } from '@/shared/constants/domain';
import { useUsers } from '../api';

/** Everyone in the organization; each person opens their details page. */
export function PeopleDirectory() {
  const { can, user } = usePermissions();
  if (!user) return <Spinner />;
  if (!can(Permission.USERS_MANAGE)) return <EmptyState icon={<Users />} title="Only project coordinators can open people's details" />;
  return <PeopleDirectoryContent />;
}

function PeopleDirectoryContent() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [page, setPage] = useState(1);
  const debounced = useDebounce(search);
  useEffect(() => setPage(1), [debounced, role]);

  const { data, isLoading, isError, error, refetch } = useUsers({
    search: debounced || undefined,
    role: (role || undefined) as OrgRole | undefined,
    isActive: true,
    page,
    limit: appConfig.defaultPageSize,
  });

  return (
    <>
      <PageHeader title="People" description="Open anyone to see their projects, open work, time and recent activity." />
      <Toolbar>
        <div className="relative w-full sm:w-64">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" />
          <Input className="pl-9" placeholder="Search people" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <Select className="w-48" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
          <option value="">Everyone</option>
          {ORG_ROLES.map((r) => (
            <option key={r} value={r}>
              {roleLabel(r)}s
            </option>
          ))}
        </Select>
      </Toolbar>
      <Card>
        {isLoading ? (
          <Spinner />
        ) : isError || !data ? (
          <ErrorState message={errorMessage(error)} onRetry={refetch} />
        ) : !data.data.length ? (
          <EmptyState icon={<Users />} title="Nobody found" />
        ) : (
          <>
            <ul className="divide-y divide-border">
              {data.data.map((person) => (
                <li key={person.id}>
                  <Link href={routes.person(person.id)} className="flex items-center gap-3 px-[var(--card-p)] py-3 transition-colors hover:bg-surface-hover">
                    <Avatar user={person} size="md" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{fullName(person)}</span>
                      <span className="block truncate text-xs text-muted">{person.jobTitle ?? person.email}</span>
                    </span>
                    <Badge tone={person.role === OrgRole.PROJECT_COORDINATOR ? 'brand' : 'neutral'}>{roleLabel(person.role)}</Badge>
                    <span className="hidden w-32 text-right text-xs text-muted md:block">{person.lastLoginAt ? `Seen ${timeAgo(person.lastLoginAt)}` : 'Never signed in'}</span>
                    <ChevronRight className="size-4 text-muted" />
                  </Link>
                </li>
              ))}
            </ul>
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} total={data.meta.total} limit={data.meta.limit} itemLabel="people" onPageChange={setPage} />
          </>
        )}
      </Card>
    </>
  );
}
