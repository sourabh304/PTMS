'use client';

import { ChevronDown, FolderKanban, Plus, Search, Star } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState, type ReactNode } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { routes } from '@/shared/config/routes';
import { Permission } from '@/shared/constants/domain';
import { cn } from '@/shared/lib/utils';
import { useProjectNavigation, useToggleFavorite } from '../api';
import type { ProjectNavItem } from '../types';
import { ProjectFormModal } from './project-form-modal';

/** Show the filter box once the list is long enough to need it. */
const FILTER_THRESHOLD = 8;

/** Sidebar section listing favorite and all projects, like a workspace's boards. */
export function ProjectsNav({ pathname }: { pathname: string }) {
  const { data: projects = [] } = useProjectNavigation();
  const { can } = usePermissions();
  const router = useRouter();
  const [filter, setFilter] = useState('');
  const [creating, setCreating] = useState(false);
  const [open, setOpen] = useState({ favorites: true, projects: true });

  const visible = useMemo(() => {
    const term = filter.trim().toLowerCase();
    return term ? projects.filter((p) => p.name.toLowerCase().includes(term) || p.key.toLowerCase().includes(term)) : projects;
  }, [projects, filter]);
  const favorites = projects.filter((p) => p.isFavorite);
  const isCurrent = (id: string) => pathname === routes.project(id) || pathname.startsWith(`${routes.project(id)}/`);

  return (
    <div className="space-y-4">
      {/* Icon rail (collapsed sidebar) only keeps a shortcut to the project list. */}
      <Link
        href={routes.projects}
        title="Projects"
        className="hidden size-10 items-center justify-center rounded-ui text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground collapsed:mx-auto collapsed:flex"
      >
        <FolderKanban className="size-[18px]" />
      </Link>

      {favorites.length > 0 && (
        <section className="collapsed:hidden">
          <SectionHeading label="Favorites" open={open.favorites} onToggle={() => setOpen((o) => ({ ...o, favorites: !o.favorites }))} />
          {open.favorites && (
            <ul className="mt-1 space-y-px">
              {favorites.map((project) => (
                <ProjectLink key={project.id} project={project} active={isCurrent(project.id)} />
              ))}
            </ul>
          )}
        </section>
      )}

      <section className="collapsed:hidden">
        <SectionHeading
          label="Projects"
          open={open.projects}
          onToggle={() => setOpen((o) => ({ ...o, projects: !o.projects }))}
          action={
            can(Permission.PROJECTS_CREATE) && (
              <button
                type="button"
                onClick={() => setCreating(true)}
                aria-label="New project"
                title="New project"
                className="flex size-6 items-center justify-center rounded-ui text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground"
              >
                <Plus className="size-4" />
              </button>
            )
          }
        />
        {open.projects && (
          <>
            {projects.length > FILTER_THRESHOLD && (
              <label className="relative mx-1 mt-1.5 block">
                <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-sidebar-muted" />
                <input
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  placeholder="Filter projects"
                  aria-label="Filter projects"
                  className="h-8 w-full rounded-ui border border-sidebar-border bg-transparent pl-8 pr-2 text-xs text-sidebar-foreground placeholder:text-sidebar-muted focus:border-brand focus:outline-none"
                />
              </label>
            )}
            <ul className="mt-1 space-y-px">
              {visible.map((project) => (
                <ProjectLink key={project.id} project={project} active={isCurrent(project.id)} />
              ))}
              {!visible.length && <li className="px-3 py-2 text-xs text-sidebar-muted">{filter ? 'No matching projects' : 'No projects yet'}</li>}
            </ul>
            <Link href={routes.projects} className="mt-1 block rounded-ui px-3 py-1.5 text-xs font-medium text-sidebar-muted hover:bg-sidebar-hover hover:text-sidebar-foreground">
              View all projects
            </Link>
          </>
        )}
      </section>

      <ProjectFormModal open={creating} onClose={() => setCreating(false)} onSaved={(project) => router.push(routes.project(project.id))} />
    </div>
  );
}

function SectionHeading({ label, open, onToggle, action }: { label: string; open: boolean; onToggle: () => void; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between pr-1">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="flex items-center gap-1 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted hover:text-sidebar-foreground"
      >
        {label}
        <ChevronDown className={cn('size-3 transition-transform', !open && '-rotate-90')} />
      </button>
      {action}
    </div>
  );
}

function ProjectLink({ project, active }: { project: ProjectNavItem; active: boolean }) {
  const toggle = useToggleFavorite();
  return (
    <li className="group relative">
      <Link
        href={routes.project(project.id)}
        aria-current={active ? 'page' : undefined}
        title={project.name}
        className={cn(
          'flex items-center gap-2.5 rounded-ui py-1.5 pl-3 pr-8 text-sm transition-colors',
          active ? 'bg-sidebar-active font-medium text-sidebar-active-foreground' : 'text-sidebar-foreground hover:bg-sidebar-hover',
        )}
      >
        <span className="size-2.5 shrink-0 rounded-[3px]" style={{ backgroundColor: project.color ?? 'var(--brand)' }} />
        <span className="truncate">{project.name}</span>
      </Link>
      <button
        type="button"
        onClick={() => toggle.mutate({ id: project.id, favorite: !project.isFavorite })}
        aria-label={project.isFavorite ? `Remove ${project.name} from favorites` : `Add ${project.name} to favorites`}
        aria-pressed={project.isFavorite}
        className={cn(
          'absolute right-1.5 top-1/2 flex size-6 -translate-y-1/2 items-center justify-center rounded-ui text-sidebar-muted transition-opacity hover:text-sidebar-foreground focus-visible:opacity-100',
          project.isFavorite ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        )}
      >
        <Star className={cn('size-3.5', project.isFavorite && 'fill-amber-400 text-amber-400')} />
      </button>
    </li>
  );
}
