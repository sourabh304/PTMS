import { MeetingType } from '@/shared/constants/domain';

/** Colour and label per kind of meeting, shared by every calendar and the legend. */
export const MEETING_TYPE_STYLES: Record<MeetingType, { label: string; color: string }> = {
  [MeetingType.INTERNAL]: { label: 'Internal meeting', color: '#2563eb' },
  [MeetingType.CLIENT]: { label: 'Client meeting', color: '#d97706' },
};

export const meetingStyle = (type: string) => MEETING_TYPE_STYLES[type as MeetingType] ?? MEETING_TYPE_STYLES[MeetingType.INTERNAL];

/** Local calendar day (YYYY-MM-DD) of an instant, in the viewer's time zone. */
export function localDayKey(value: string | Date): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export const formatTime = (value: string) => new Date(value).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

export function formatMeetingRange(meeting: { startsAt: string; endsAt: string }): string {
  const day = new Date(meeting.startsAt).toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
  return `${day} · ${formatTime(meeting.startsAt)} – ${formatTime(meeting.endsAt)}`;
}
