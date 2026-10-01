export const DAY_MS = 86_400_000;

/** Pixel width of a day for each zoom level. */
export const GANTT_ZOOM = {
  day: 36,
  week: 14,
  month: 5,
} as const;
export type GanttZoom = keyof typeof GANTT_ZOOM;

export const GANTT_LAYOUT = {
  rowHeight: 40,
  barHeight: 22,
  headerHeight: 56,
  sidebarWidth: 320,
  /** Days of breathing room before/after the plotted range. */
  paddingDays: 7,
} as const;

/** Parses API dates (UTC midnight) into a day number. */
export function toDay(value: string | Date): number {
  const date = typeof value === 'string' ? new Date(value) : value;
  return Math.floor(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) / DAY_MS);
}

export function dayToDate(day: number): Date {
  return new Date(day * DAY_MS);
}

export function dayToIso(day: number): string {
  return dayToDate(day).toISOString().slice(0, 10);
}

export function todayDay(): number {
  const now = new Date();
  return Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / DAY_MS);
}

export interface TimelineSegment {
  label: string;
  startDay: number;
  days: number;
}

/** Builds the two header rows (months on top, days or weeks below). */
export function buildTimeline(startDay: number, endDay: number, zoom: GanttZoom) {
  const months: TimelineSegment[] = [];
  const units: TimelineSegment[] = [];
  const monthFormat = new Intl.DateTimeFormat(undefined, { month: zoom === 'month' ? 'short' : 'long', year: 'numeric', timeZone: 'UTC' });

  for (let day = startDay; day <= endDay; ) {
    const date = dayToDate(day);
    const nextMonth = toDay(new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1)));
    const until = Math.min(nextMonth, endDay + 1);
    months.push({ label: monthFormat.format(date), startDay: day, days: until - day });
    day = until;
  }

  if (zoom === 'day') {
    for (let day = startDay; day <= endDay; day++) {
      units.push({ label: String(dayToDate(day).getUTCDate()), startDay: day, days: 1 });
    }
  } else if (zoom === 'week') {
    for (let day = startDay; day <= endDay; day += 7) {
      units.push({ label: String(dayToDate(day).getUTCDate()), startDay: day, days: Math.min(7, endDay - day + 1) });
    }
  }
  return { months, units };
}

export const isWeekend = (day: number) => {
  const weekday = dayToDate(day).getUTCDay();
  return weekday === 0 || weekday === 6;
};
