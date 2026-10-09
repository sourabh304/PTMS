import { daysFromToday } from '@/shared/lib/utils';

/** Date buckets of My work, in display order. */
export const DATE_BUCKETS = [
  { id: 'past', label: 'Past dates', color: '#e2445c' },
  { id: 'today', label: 'Today', color: '#00c875' },
  { id: 'thisWeek', label: 'This week', color: '#0086c0' },
  { id: 'nextWeek', label: 'Next week', color: '#a25ddc' },
  { id: 'later', label: 'Later', color: '#579bfc' },
  { id: 'noDate', label: 'Without a date', color: '#a6a6a6' },
] as const;

export type DateBucketId = (typeof DATE_BUCKETS)[number]['id'];

/**
 * Places a due date in a bucket. Weeks follow the organization's first weekday
 * (0 = Sunday … 6 = Saturday).
 */
export function bucketFor(dueDate: string | null, weekStartsOn: number, today = new Date()): DateBucketId {
  const days = daysFromToday(dueDate);
  if (days === null) return 'noDate';
  if (days < 0) return 'past';
  if (days === 0) return 'today';
  const daysLeftThisWeek = (weekStartsOn + 6 - today.getDay()) % 7;
  if (days <= daysLeftThisWeek) return 'thisWeek';
  if (days <= daysLeftThisWeek + 7) return 'nextWeek';
  return 'later';
}
