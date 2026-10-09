import { StatusCategory } from '@/shared/constants/domain';
import { formatShortDate } from '@/shared/lib/utils';
import type { LookupRef } from '@/shared/types/api';
import type { Task } from '../../types';
import { GROUP_STRIP_WIDTH, TABLE_GRID, TABLE_MIN_WIDTH } from './table-columns';

/** Share of tasks per label, in first-seen order, for the distribution bars. */
function distribution(tasks: Task[], pick: (task: Task) => LookupRef) {
  const counts = new Map<string, { lookup: LookupRef; count: number }>();
  tasks.forEach((task) => {
    const lookup = pick(task);
    const entry = counts.get(lookup.id) ?? { lookup, count: 0 };
    entry.count += 1;
    counts.set(lookup.id, entry);
  });
  return [...counts.values()];
}

function DistributionBar({ tasks, pick }: { tasks: Task[]; pick: (task: Task) => LookupRef }) {
  const parts = distribution(tasks, pick);
  return (
    <div className="flex h-6 w-full overflow-hidden rounded-[3px]" role="img" aria-label={parts.map((p) => `${p.lookup.name}: ${p.count}`).join(', ')}>
      {parts.map(({ lookup, count }) => (
        <span key={lookup.id} title={`${lookup.name}: ${count} of ${tasks.length}`} style={{ backgroundColor: lookup.color, width: `${(count / tasks.length) * 100}%` }} />
      ))}
    </div>
  );
}

/** Footer of a group: how its tasks are distributed across each column. */
export function GroupSummary({ tasks }: { tasks: Task[] }) {
  if (!tasks.length) return null;
  const starts = tasks.map((t) => t.startDate ?? t.dueDate).filter((d): d is string => !!d).sort();
  const dues = tasks.map((t) => t.dueDate ?? t.startDate).filter((d): d is string => !!d).sort();
  const estimate = Math.round(tasks.reduce((sum, t) => sum + (t.estimatedHours ?? 0), 0) * 10) / 10;
  const done = tasks.filter((t) => t.status.category === StatusCategory.CLOSED).length;
  const progress = Math.round(tasks.reduce((sum, t) => sum + t.progress, 0) / tasks.length);

  return (
    <div role="row" aria-label="Group summary" className="grid h-10 text-xs text-muted" style={{ gridTemplateColumns: TABLE_GRID, minWidth: TABLE_MIN_WIDTH }}>
      <span />
      <span className="sticky bg-background" style={{ left: GROUP_STRIP_WIDTH }} />
      <span className="border-l border-border" />
      <div className="flex items-center px-1.5" title={`${done} of ${tasks.length} done`}>
        <DistributionBar tasks={tasks} pick={(t) => t.status} />
      </div>
      <div className="flex items-center px-1.5">
        <DistributionBar tasks={tasks} pick={(t) => t.priority} />
      </div>
      <div className="flex items-center justify-center tabular-nums">
        {starts.length ? `${formatShortDate(starts[0])} – ${formatShortDate(dues[dues.length - 1])}` : '—'}
      </div>
      <div className="flex items-center justify-center font-medium tabular-nums text-foreground-soft">{estimate ? `${estimate}h` : '—'}</div>
      <div className="flex items-center justify-center font-medium tabular-nums text-foreground-soft">{progress}% avg</div>
    </div>
  );
}
