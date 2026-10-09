/**
 * Calendar math on `YYYY-MM-DD` keys. Task dates are stored as UTC midnight, so working
 * on date keys in UTC avoids timezone drift when tasks are moved between days.
 */
export type DateKey = string;

const DAY_MS = 86_400_000;

export const toKey = (date: Date): DateKey => date.toISOString().slice(0, 10);
export const fromKey = (key: DateKey): Date => new Date(`${key}T00:00:00.000Z`);
export const taskKey = (value: string | null | undefined): DateKey | null => (value ? value.slice(0, 10) : null);
export const addDays = (key: DateKey, days: number): DateKey => toKey(new Date(fromKey(key).getTime() + days * DAY_MS));
export const diffDays = (from: DateKey, to: DateKey): number => Math.round((fromKey(to).getTime() - fromKey(from).getTime()) / DAY_MS);

export function todayKey(): DateKey {
  const now = new Date();
  return toKey(new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate())));
}

/** First day of the week containing `key` (weekStartsOn: 0 = Sunday … 6 = Saturday). */
export function startOfWeekKey(key: DateKey, weekStartsOn: number): DateKey {
  const day = fromKey(key).getUTCDay();
  return addDays(key, -((day - weekStartsOn + 7) % 7));
}

/** The 6×7 grid of days shown for the month of `monthKey` (any day in that month). */
export function monthGrid(monthKey: DateKey, weekStartsOn: number): DateKey[] {
  const first = `${monthKey.slice(0, 7)}-01`;
  const start = startOfWeekKey(first, weekStartsOn);
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

export function shiftMonth(monthKey: DateKey, months: number): DateKey {
  const date = fromKey(`${monthKey.slice(0, 7)}-01`);
  date.setUTCMonth(date.getUTCMonth() + months);
  return toKey(date);
}

export const isWeekend = (key: DateKey): boolean => {
  const day = fromKey(key).getUTCDay();
  return day === 0 || day === 6;
};

/** Days from `start` to `end` inclusive. */
export function daysBetween(start: DateKey, end: DateKey): DateKey[] {
  const span = diffDays(start, end);
  if (span < 0) return [start];
  return Array.from({ length: span + 1 }, (_, i) => addDays(start, i));
}

export const monthLabel = (monthKey: DateKey): string =>
  fromKey(monthKey).toLocaleDateString(undefined, { month: 'long', year: 'numeric', timeZone: 'UTC' });

export const weekdayLabels = (weekStartsOn: number): string[] =>
  Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 7 + ((weekStartsOn + i) % 7))).toLocaleDateString(undefined, { weekday: 'short', timeZone: 'UTC' }),
  );
