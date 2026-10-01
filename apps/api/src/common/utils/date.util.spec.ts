import { countWorkingDays, startOfWeekUtc } from './date.util';

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
});
