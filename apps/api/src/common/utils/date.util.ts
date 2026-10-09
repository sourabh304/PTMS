const DAY_MS = 86_400_000;

export function startOfDayUtc(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

/** Start of the week containing `date`, honoring the organization's first weekday (0 = Sunday). */
export function startOfWeekUtc(date: Date, weekStartsOn: number): Date {
  const day = startOfDayUtc(date);
  const diff = (day.getUTCDay() - weekStartsOn + 7) % 7;
  return new Date(day.getTime() - diff * DAY_MS);
}

/** Today's calendar date in the given IANA timezone, as UTC midnight (how the API stores dates). */
export function todayInTimezone(timezone: string, now = new Date()): Date {
  let parts: string;
  try {
    parts = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
  } catch {
    return startOfDayUtc(now);
  }
  const [year, month, day] = parts.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS);
}

/** Counts Monday–Friday days in [from, to] (inclusive). */
export function countWorkingDays(from: Date, to: Date): number {
  let count = 0;
  for (let cursor = startOfDayUtc(from); cursor <= to; cursor = addDays(cursor, 1)) {
    const weekday = cursor.getUTCDay();
    if (weekday !== 0 && weekday !== 6) count++;
  }
  return count;
}
