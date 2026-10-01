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
