'use client';

import { useQuery } from '@tanstack/react-query';
import { Bug, CornerDownLeft, FolderKanban, ListChecks, Loader2, Search } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { Issue } from '@/features/issues/types';
import type { Project } from '@/features/projects/types';
import type { Task } from '@/features/tasks/types';
import { routes } from '@/shared/config/routes';
import { useDebounce } from '@/shared/hooks/use-debounce';
import { api } from '@/shared/lib/api-client';
import { cn } from '@/shared/lib/utils';
import type { Paginated } from '@/shared/types/api';
import { ColorBadge } from '@/shared/ui/badge';

/** Results per group in the palette. */
const RESULTS_PER_GROUP = 5;
const MIN_QUERY_LENGTH = 2;

interface ResultItem {
  id: string;
  group: 'Projects' | 'Tasks' | 'Issues';
  icon: ReactNode;
  title: string;
  meta: string;
  badge?: { color: string; label: string };
  href: string;
}

function useSearchResults(term: string) {
  const enabled = term.length >= MIN_QUERY_LENGTH;
  const params = { search: term, limit: RESULTS_PER_GROUP };
  return useQuery({
    queryKey: ['global-search', term],
    enabled,
    staleTime: 15_000,
    queryFn: async (): Promise<ResultItem[]> => {
      const [projects, tasks, issues] = await Promise.all([
        api.get<Paginated<Project>>('/projects', params),
        api.get<Paginated<Task>>('/tasks', params),
        api.get<Paginated<Issue>>('/issues', params),
      ]);
      return [
        ...projects.data.map((p) => ({
          id: p.id,
          group: 'Projects' as const,
          icon: <FolderKanban />,
          title: p.name,
          meta: p.key,
          badge: { color: p.status.color, label: p.status.name },
          href: routes.project(p.id),
        })),
        ...tasks.data.map((t) => ({
          id: t.id,
          group: 'Tasks' as const,
          icon: <ListChecks />,
          title: t.title,
          meta: `${t.project.key}-${t.number} · ${t.project.name}`,
          badge: { color: t.status.color, label: t.status.name },
          href: `${routes.projectTasks(t.projectId)}?taskId=${t.id}`,
        })),
        ...issues.data.map((i) => ({
          id: i.id,
          group: 'Issues' as const,
          icon: <Bug />,
          title: i.title,
          meta: `${i.project.key}-BUG-${i.number} · ${i.project.name}`,
          badge: { color: i.status.color, label: i.status.name },
          href: `${routes.projectIssues(i.projectId)}?issueId=${i.id}`,
        })),
      ];
    },
  });
}

const isMac = () => typeof navigator !== 'undefined' && /mac|iphone|ipad/i.test(navigator.platform);

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [shortcut, setShortcut] = useState('Ctrl K');

  useEffect(() => {
    setShortcut(isMac() ? '⌘K' : 'Ctrl K');
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        setOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Search"
        className="flex h-9 items-center gap-2.5 rounded-ui text-sm text-muted transition-colors hover:text-foreground sm:w-full sm:max-w-md sm:border sm:border-border sm:bg-surface-muted/60 sm:px-3 sm:hover:border-border-strong max-sm:size-9 max-sm:justify-center max-sm:hover:bg-surface-muted"
      >
        <Search className="size-4 shrink-0" />
        <span className="hidden flex-1 truncate text-left sm:block">Search projects, tasks, issues…</span>
        <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 font-mono text-[10px] font-medium text-muted sm:block">{shortcut}</kbd>
      </button>
      {open && <SearchPalette onClose={() => setOpen(false)} />}
    </>
  );
}

function SearchPalette({ onClose }: { onClose: () => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [activeIndex, setActiveIndex] = useState(0);
  const term = useDebounce(query.trim(), 200);
  const { data: results = [], isFetching } = useSearchResults(term);

  useEffect(() => {
    inputRef.current?.focus();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
    };
  }, []);
  useEffect(() => setActiveIndex(0), [results]);

  const grouped = useMemo(() => {
    const groups = new Map<string, (ResultItem & { index: number })[]>();
    results.forEach((item, index) => groups.set(item.group, [...(groups.get(item.group) ?? []), { ...item, index }]));
    return [...groups.entries()];
  }, [results]);

  const go = (item: ResultItem | undefined) => {
    if (!item) return;
    onClose();
    router.push(item.href);
  };

  const onKeyDown = (event: ReactKeyboardEvent) => {
    if (event.key === 'Escape') onClose();
    else if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      go(results[activeIndex]);
    }
  };

  const tooShort = term.length < MIN_QUERY_LENGTH;

  return createPortal(
    <div className="fixed inset-0 z-50 flex animate-fade-in items-start justify-center bg-overlay p-3 pt-[12vh] backdrop-blur-[1px]" onMouseDown={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(event) => event.stopPropagation()}
        onKeyDown={onKeyDown}
        className="w-full max-w-xl animate-pop-in overflow-hidden rounded-ui-lg border border-border bg-surface shadow-ui-lg"
      >
        <div className="flex items-center gap-3 border-b border-border px-4">
          {isFetching ? <Loader2 className="size-4 animate-spin text-muted" /> : <Search className="size-4 text-muted" />}
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, tasks, issues…"
            aria-label="Search query"
            className="h-12 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted"
          />
          <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-muted">Esc</kbd>
        </div>

        <div className="scrollbar-thin max-h-[60vh] overflow-y-auto p-1.5">
          {tooShort ? (
            <p className="px-3 py-8 text-center text-sm text-muted">Type at least {MIN_QUERY_LENGTH} characters to search.</p>
          ) : !results.length && !isFetching ? (
            <p className="px-3 py-8 text-center text-sm text-muted">No results for “{term}”.</p>
          ) : (
            grouped.map(([group, items]) => (
              <div key={group} className="py-1">
                <p className="px-2.5 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-muted">{group}</p>
                {items.map((item) => (
                  <button
                    key={`${item.group}-${item.id}`}
                    type="button"
                    onMouseEnter={() => setActiveIndex(item.index)}
                    onClick={() => go(item)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-ui px-2.5 py-2 text-left transition-colors',
                      item.index === activeIndex ? 'bg-surface-muted' : 'hover:bg-surface-muted/60',
                    )}
                  >
                    <span className="text-muted [&_svg]:size-4">{item.icon}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{item.title}</span>
                      <span className="block truncate font-mono text-[11px] text-muted">{item.meta}</span>
                    </span>
                    {item.badge && <ColorBadge color={item.badge.color} label={item.badge.label} className="hidden sm:inline-flex" />}
                    {item.index === activeIndex && <CornerDownLeft className="size-3.5 text-muted" />}
                  </button>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
