import { countWorkingDays, startOfWeekUtc, todayInTimezone } from './date.util';

describe('date utils', () => {
  it('finds the start of the week for a Monday-first organization', () => {
    // Wednesday 2026-09-30
    expect(startOfWeekUtc(new Date('2026-09-30T15:00:00Z'), 1).toISOString()).toBe('2026-09-28T00:00:00.000Z');
  });

  it('finds the start of the week for a Sunday-first organization', () => {
    expect(startOfWeekUtc(new Date('2026-09-30T15:00:00Z'), 0).toISOString()).toBe('2026-09-27T00:00:00.000Z');
  });

  it('counts weekdays only', () => {
    expect(countWorkingDays(new Date('2026-09-28'), new Date('2026-10-04'))).toBe(5);
  });

  it('reads today in the organization timezone', () => {
    const now = new Date('2026-10-09T20:00:00Z');
    expect(todayInTimezone('UTC', now).toISOString()).toBe('2026-10-09T00:00:00.000Z');
    expect(todayInTimezone('Asia/Kolkata', now).toISOString()).toBe('2026-10-10T00:00:00.000Z');
    expect(todayInTimezone('America/Los_Angeles', now).toISOString()).toBe('2026-10-09T00:00:00.000Z');
  });

  it('falls back to the UTC date for an unknown timezone', () => {
    expect(todayInTimezone('Not/AZone', new Date('2026-10-09T23:30:00Z')).toISOString()).toBe('2026-10-09T00:00:00.000Z');
  });
});
