'use client';

import { useEffect, useId, useState, type FormEvent } from 'react';
import { useProjectNavigation } from '@/features/projects/api';
import { MeetingType } from '@/shared/constants/domain';
import { errorMessage } from '@/shared/lib/api-client';
import { Button } from '@/shared/ui/button';
import { Field, FormAlert, Input, Select, Textarea } from '@/shared/ui/form';
import { Modal } from '@/shared/ui/modal';
import { cn } from '@/shared/lib/utils';
import { useCreateMeeting, useUpdateMeeting } from '../api';
import { MEETING_TYPE_STYLES } from '../meeting-types';
import type { Meeting } from '../types';

interface MeetingFormModalProps {
  open: boolean;
  onClose: () => void;
  /** Meeting being edited; omit to schedule a new one. */
  meeting?: Meeting | null;
  /** Day (YYYY-MM-DD) to pre-fill for a new meeting. */
  defaultDay?: string;
  /** Project to pre-select for a new meeting (null = whole organization). */
  defaultProjectId?: string | null;
  /** Called with the meeting as saved, before the form closes. */
  onSaved?: (meeting: Meeting) => void;
}

const DEFAULT_START = '10:00';
const DEFAULT_MINUTES = 30;
/** Same limits as the API. */
const MAX_TITLE = 150;
const MAX_TEXT = 2000;
const MAX_MEETING_MS = 24 * 60 * 60 * 1000;

const pad = (n: number) => String(n).padStart(2, '0');
const localDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const localTime = (d: Date) => `${pad(d.getHours())}:${pad(d.getMinutes())}`;
/** The day after a `YYYY-MM-DD` date. */
const dayAfter = (day: string) => {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(y, m - 1, d + 1);
};

const TOO_LONG = {
  title: `Keep the title to ${MAX_TITLE} characters or fewer`,
  link: `The meeting link can be at most ${MAX_TEXT.toLocaleString()} characters`,
  description: `Keep the notes to ${MAX_TEXT.toLocaleString()} characters or fewer`,
};

/** The API names the request field ("title must be shorter than…"); say it in the form's words instead. */
const SERVER_FIELD_MESSAGES: [RegExp, string][] = [
  [/^title\b/, TOO_LONG.title],
  [/^description\b/, TOO_LONG.description],
  [/^link\b/, 'Paste the full meeting link, starting with https://'],
  [/^(startsAt|endsAt)\b/, 'Pick a date and times'],
];
const friendlyError = (error: unknown) => {
  const message = errorMessage(error);
  return SERVER_FIELD_MESSAGES.find(([pattern]) => pattern.test(message))?.[1] ?? message;
};

function emptyValues(day: string | undefined, projectId: string | null | undefined) {
  const [h, m] = DEFAULT_START.split(':').map(Number);
  const end = new Date(2000, 0, 1, h, m + DEFAULT_MINUTES);
  return {
    title: '',
    description: '',
    type: MeetingType.INTERNAL as MeetingType,
    link: '',
    day: day ?? localDate(new Date()),
    start: DEFAULT_START,
    end: localTime(end),
    projectId: projectId ?? '',
  };
}

/** Schedule or edit a meeting: link, time, kind and who sees it (a project or everyone). */
export function MeetingFormModal({ open, onClose, meeting, defaultDay, defaultProjectId, onSaved }: MeetingFormModalProps) {
  const formId = useId();
  const create = useCreateMeeting();
  const update = useUpdateMeeting();
  const { data: projects } = useProjectNavigation(open);
  const [values, setValues] = useState(() => emptyValues(defaultDay, defaultProjectId));
  const [error, setError] = useState('');

  useEffect(() => {
    if (!open) return;
    setError('');
    if (meeting) {
      const start = new Date(meeting.startsAt);
      setValues({
        title: meeting.title,
        description: meeting.description ?? '',
        type: meeting.type,
        link: meeting.link,
        day: localDate(start),
        start: localTime(start),
        end: localTime(new Date(meeting.endsAt)),
        projectId: meeting.projectId ?? '',
      });
    } else {
      setValues(emptyValues(defaultDay, defaultProjectId));
    }
  }, [open, meeting, defaultDay, defaultProjectId]);

  // Archived projects are read-only and left out of the list. A new meeting never starts on one; a meeting
  // that already belongs to one keeps it as an option, so the audience shown is the audience saved.
  const listed = !values.projectId || !projects || projects.some((project) => project.id === values.projectId);
  const keptProject = !listed && meeting?.project?.id === values.projectId ? meeting.project : null;
  useEffect(() => {
    if (!listed && !meeting) setValues((v) => ({ ...v, projectId: '' }));
  }, [listed, meeting]);

  // An end time that is not after the start time is on the next day (a meeting that crosses midnight).
  const overnight = !!values.start && !!values.end && values.end <= values.start;
  const nextDay = overnight && values.day ? dayAfter(values.day) : null;
  const endDay = nextDay ? localDate(nextDay) : values.day;

  const set = (key: keyof typeof values) => (event: { target: { value: string } }) => setValues((v) => ({ ...v, [key]: event.target.value }));

  const submit = (event: FormEvent) => {
    event.preventDefault();
    const title = values.title.trim();
    const link = values.link.trim();
    const description = values.description.trim();
    if (!title) return setError('Give the meeting a title');
    if (title.length > MAX_TITLE) return setError(TOO_LONG.title);
    if (!/^https?:\/\/\S+$/i.test(link)) return setError('Paste the full meeting link, starting with https://');
    if (link.length > MAX_TEXT) return setError(TOO_LONG.link);
    if (description.length > MAX_TEXT) return setError(TOO_LONG.description);
    const startsAt = new Date(`${values.day}T${values.start}`);
    const endsAt = new Date(`${endDay}T${values.end}`);
    if (Number.isNaN(startsAt.getTime()) || Number.isNaN(endsAt.getTime())) return setError('Pick a date and times');
    if (endsAt <= startsAt) return setError('The meeting must end after it starts');
    if (endsAt.getTime() - startsAt.getTime() > MAX_MEETING_MS) return setError('A meeting can last at most 24 hours');
    setError('');
    const input = {
      title,
      description: description || null,
      type: values.type,
      link,
      startsAt: startsAt.toISOString(),
      endsAt: endsAt.toISOString(),
      projectId: values.projectId || null,
    };
    const callbacks = {
      onSuccess: (saved: Meeting) => {
        onSaved?.(saved);
        onClose();
      },
      onError: (err: unknown) => setError(friendlyError(err)),
    };
    if (meeting) update.mutate({ id: meeting.id, ...input }, callbacks);
    else create.mutate(input, callbacks);
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={meeting ? 'Edit meeting' : 'Schedule a meeting'}
      description="Everyone who can see it gets a notification on the morning of the meeting."
      footer={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          {/* Outside the form, but submits it (as does Enter in a field). */}
          <Button type="submit" form={formId} loading={create.isPending || update.isPending}>
            {meeting ? 'Save' : 'Schedule'}
          </Button>
        </>
      }
    >
      {/* noValidate: the checks in submit() give clearer messages than the browser's. */}
      <form id={formId} onSubmit={submit} noValidate className="grid gap-4 sm:grid-cols-3">
        {error && (
          <div className="sm:col-span-3">
            <FormAlert>{error}</FormAlert>
          </div>
        )}
        <Field label="Title" required className="sm:col-span-3">
          <Input autoFocus value={values.title} onChange={set('title')} maxLength={MAX_TITLE} placeholder="e.g. Weekly sync" />
        </Field>
        <div className="sm:col-span-3">
          <p className="mb-1.5 text-sm font-medium text-foreground">Kind</p>
          <div className="grid grid-cols-2 gap-2" role="radiogroup">
            {Object.values(MeetingType).map((type) => {
              const style = MEETING_TYPE_STYLES[type];
              const active = values.type === type;
              return (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setValues((v) => ({ ...v, type }))}
                  className={cn(
                    'flex items-center gap-2 rounded-ui border px-3 py-2 text-sm transition-colors',
                    active ? 'border-transparent ring-2' : 'border-border hover:bg-surface-muted',
                  )}
                  style={active ? { boxShadow: `0 0 0 2px ${style.color}`, backgroundColor: `${style.color}14` } : undefined}
                >
                  <span className="size-2.5 rounded-full" style={{ backgroundColor: style.color }} />
                  {style.label}
                </button>
              );
            })}
          </div>
        </div>
        <Field label="Meeting link" required hint="Zoom, Teams, Google Meet… everyone who can see the meeting can open it." className="sm:col-span-3">
          <Input type="url" value={values.link} onChange={set('link')} maxLength={MAX_TEXT} placeholder="https://" />
        </Field>
        <Field label="Date" required>
          <Input type="date" value={values.day} onChange={set('day')} />
        </Field>
        <Field label="Starts" required>
          <Input type="time" value={values.start} onChange={set('start')} />
        </Field>
        <Field
          label="Ends"
          required
          hint={overnight ? `Next day${nextDay ? ` (${nextDay.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })})` : ''}` : undefined}
        >
          <Input type="time" value={values.end} onChange={set('end')} />
        </Field>
        <Field label="Visible to" className="sm:col-span-3">
          <Select value={values.projectId} onChange={set('projectId')}>
            <option value="">Everyone in the organization</option>
            {keptProject && <option value={keptProject.id}>Members of {keptProject.name} (archived)</option>}
            {projects?.map((project) => (
              <option key={project.id} value={project.id}>
                Members of {project.name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Notes" className="sm:col-span-3">
          <Textarea rows={2} value={values.description} onChange={set('description')} maxLength={MAX_TEXT} placeholder="Agenda, dial-in details…" />
        </Field>
      </form>
    </Modal>
  );
}
