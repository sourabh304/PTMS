'use client';

import { AlertCircle } from 'lucide-react';
import { useState } from 'react';
import { cn, daysFromToday, formatShortDate, isOverdue, toInputDate } from '@/shared/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, FormAlert, Input } from '@/shared/ui/form';
import { Popover } from '@/shared/ui/popover';

interface TimelineCellProps {
  startDate: string | null;
  dueDate: string | null;
  /** Fill color of the timeline pill (the group color). */
  color: string;
  closed: boolean;
  onChange: (dates: { startDate: string | null; dueDate: string | null }) => void;
  disabled?: boolean;
}

/** Share of the timeline already elapsed, 0-100 (100 once the due date has passed). */
function elapsedPercent(startDate: string | null, dueDate: string | null): number {
  const untilDue = daysFromToday(dueDate);
  if (untilDue === null) return 0;
  const sinceStart = -(daysFromToday(startDate ?? dueDate) ?? 0);
  const total = sinceStart + untilDue;
  if (total <= 0) return untilDue < 0 ? 100 : 0;
  return Math.max(0, Math.min(100, Math.round((sinceStart / total) * 100)));
}

function rangeLabel(startDate: string | null, dueDate: string | null): string {
  if (startDate && dueDate) return `${formatShortDate(startDate)} – ${formatShortDate(dueDate)}`;
  return formatShortDate(dueDate ?? startDate);
}

/** Start → due range as a filled pill; overdue work is flagged. */
export function TimelineCell({ startDate, dueDate, color, closed, onChange, disabled }: TimelineCellProps) {
  const overdue = isOverdue(dueDate, closed);
  const hasDates = !!(startDate || dueDate);
  const elapsed = closed ? 100 : elapsedPercent(startDate, dueDate);

  return (
    <Popover
      align="center"
      disabled={disabled}
      className="w-72 p-3"
      trigger={({ ref, toggle }) => (
        <button
          ref={ref}
          type="button"
          onClick={toggle}
          disabled={disabled}
          aria-label={hasDates ? `Timeline ${rangeLabel(startDate, dueDate)}` : 'Set timeline'}
          className="group/timeline flex h-full w-full items-center justify-center px-2.5 disabled:cursor-default"
        >
          {hasDates ? (
            <span
              className="relative flex h-6 w-full items-center justify-center overflow-hidden rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: `color-mix(in srgb, ${color} 45%, var(--border-strong))` }}
            >
              <span className="absolute inset-y-0 left-0" style={{ width: `${elapsed}%`, backgroundColor: color }} />
              <span className="relative flex items-center gap-1 truncate px-2 [text-shadow:0_1px_1px_rgb(0_0_0/0.25)]">
                {overdue && <AlertCircle className="size-3.5 shrink-0" aria-label="Overdue" />}
                {rangeLabel(startDate, dueDate)}
              </span>
            </span>
          ) : (
            <span className="text-xs text-muted opacity-0 transition-opacity group-hover/timeline:opacity-100">Set dates</span>
          )}
        </button>
      )}
    >
      {(close) => (
        <TimelineEditor
          startDate={startDate}
          dueDate={dueDate}
          onSave={(dates) => {
            onChange(dates);
            close();
          }}
        />
      )}
    </Popover>
  );
}

function TimelineEditor({ startDate, dueDate, onSave }: Pick<TimelineCellProps, 'startDate' | 'dueDate'> & { onSave: TimelineCellProps['onChange'] }) {
  const [start, setStart] = useState(toInputDate(startDate));
  const [due, setDue] = useState(toInputDate(dueDate));
  const invalid = !!(start && due && start > due);

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Field label="Start" htmlFor="timeline-start">
          <Input id="timeline-start" type="date" value={start} max={due || undefined} onChange={(e) => setStart(e.target.value)} />
        </Field>
        <Field label="Due" htmlFor="timeline-due">
          <Input id="timeline-due" type="date" value={due} min={start || undefined} onChange={(e) => setDue(e.target.value)} />
        </Field>
      </div>
      {invalid && <FormAlert>The due date must be on or after the start date.</FormAlert>}
      <div className={cn('flex gap-2', startDate || dueDate ? 'justify-between' : 'justify-end')}>
        {(startDate || dueDate) && (
          <Button variant="ghost" size="sm" onClick={() => onSave({ startDate: null, dueDate: null })}>
            Clear
          </Button>
        )}
        <Button size="sm" disabled={invalid} onClick={() => onSave({ startDate: start || null, dueDate: due || null })}>
          Save
        </Button>
      </div>
    </div>
  );
}
