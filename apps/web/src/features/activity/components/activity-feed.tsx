'use client';

import { Activity as ActivityIcon } from 'lucide-react';
import Link from 'next/link';
import { routes } from '@/shared/config/routes';
import { errorMessage } from '@/shared/lib/api-client';
import { fullName, timeAgo } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Button } from '@/shared/ui/button';
import { EmptyState, ErrorState, Spinner } from '@/shared/ui/feedback';
import { useActivities } from '../api';

interface ActivityFeedProps {
  projectId?: string;
  pageSize?: number;
  /** Show the "load more" control. */
  paginated?: boolean;
  showProject?: boolean;
}

export function ActivityFeed({ projectId, pageSize, paginated = true, showProject = !projectId }: ActivityFeedProps) {
  const { data, isLoading, isError, error, refetch, fetchNextPage, hasNextPage, isFetchingNextPage } = useActivities(projectId, pageSize);
  const items = data?.pages.flatMap((page) => page.data) ?? [];

  if (isLoading) return <Spinner />;
  if (isError) return <ErrorState message={errorMessage(error)} onRetry={refetch} />;
  if (!items.length) return <EmptyState icon={<ActivityIcon className="size-6" />} title="No activity yet" />;

  return (
    <div>
      <ol className="relative space-y-5 before:absolute before:bottom-2 before:left-[13px] before:top-2 before:w-px before:bg-border">
        {items.map((item) => (
          <li key={item.id} className="relative flex gap-3">
            <Avatar user={item.actor} size="sm" />
            <div className="min-w-0 text-sm">
              <p>
                <span className="font-medium">{fullName(item.actor)}</span> <span className="text-foreground/80">{item.summary}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted">
                {timeAgo(item.createdAt)}
                {showProject && item.project && (
                  <>
                    {' · '}
                    <Link href={routes.project(item.project.id)} className="hover:text-brand">
                      {item.project.name}
                    </Link>
                  </>
                )}
              </p>
            </div>
          </li>
        ))}
      </ol>
      {paginated && hasNextPage && (
        <div className="mt-5 text-center">
          <Button variant="secondary" size="sm" onClick={() => fetchNextPage()} loading={isFetchingNextPage}>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}
