'use client';

import { Check, Search, UserRoundPlus } from 'lucide-react';
import { useState } from 'react';
import { cn, fullName } from '@/shared/lib/utils';
import type { UserSummary } from '@/shared/types/api';
import { Avatar, AvatarGroup } from '@/shared/ui/avatar';
import { Popover } from '@/shared/ui/popover';

interface PeopleCellProps {
  assignees: UserSummary[];
  /** People who can be assigned (project members). */
  candidates: UserSummary[];
  onChange: (assigneeIds: string[]) => void;
  disabled?: boolean;
}

/** Assignee avatars; opens a searchable member picker. */
export function PeopleCell({ assignees, candidates, onChange, disabled }: PeopleCellProps) {
  const [search, setSearch] = useState('');
  const selected = new Set(assignees.map((a) => a.id));
  const term = search.trim().toLowerCase();
  const matches = candidates.filter((user) => !term || fullName(user).toLowerCase().includes(term) || user.email.toLowerCase().includes(term));

  const toggle = (id: string) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onChange([...next]);
  };

  return (
    <Popover
      align="center"
      disabled={disabled}
      className="w-64"
      trigger={({ ref, toggle: open }) => (
        <button
          ref={ref}
          type="button"
          onClick={open}
          disabled={disabled}
          aria-label={assignees.length ? `Owners: ${assignees.map(fullName).join(', ')}` : 'Assign an owner'}
          className="group/people flex h-full w-full items-center justify-center hover:bg-surface-hover disabled:cursor-default disabled:hover:bg-transparent"
        >
          {assignees.length ? (
            <AvatarGroup users={assignees} max={3} />
          ) : (
            <UserRoundPlus className="size-[18px] text-border-strong transition-colors group-hover/people:text-muted" />
          )}
        </button>
      )}
    >
      {() => (
        <div>
          <label className="relative block">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search names"
              aria-label="Search people"
              className="h-8 w-full rounded-ui border border-border bg-surface pl-8 pr-2 text-sm focus:border-brand focus:outline-none"
            />
          </label>
          <ul className="scrollbar-thin mt-2 max-h-64 space-y-px overflow-y-auto">
            {matches.map((user) => {
              const isSelected = selected.has(user.id);
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => toggle(user.id)}
                    aria-pressed={isSelected}
                    className={cn('flex w-full items-center gap-2.5 rounded-ui px-2 py-1.5 text-left text-sm hover:bg-surface-muted', isSelected && 'bg-brand-soft')}
                  >
                    <Avatar user={user} size="xs" className="ring-0" />
                    <span className="min-w-0 flex-1 truncate">{fullName(user)}</span>
                    {isSelected && <Check className="size-4 text-brand" />}
                  </button>
                </li>
              );
            })}
            {!matches.length && <li className="px-2 py-3 text-center text-xs text-muted">No people found</li>}
          </ul>
        </div>
      )}
    </Popover>
  );
}
