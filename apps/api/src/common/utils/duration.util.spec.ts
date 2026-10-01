import { parseDurationMs } from './duration.util';

describe('parseDurationMs', () => {
  it.each([
    ['500ms', 500],
    ['30s', 30_000],
    ['15m', 900_000],
    ['2h', 7_200_000],
    ['7d', 604_800_000],
    ['60', 60_000],
  ])('parses %s', (input, expected) => {
    expect(parseDurationMs(input)).toBe(expected);
  });

  it('rejects invalid input', () => {
    expect(() => parseDurationMs('soon')).toThrow();
  });
});
