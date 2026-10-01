const UNIT_MS: Record<string, number> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
};

/** Converts a duration such as `15m`, `7d` or `3600` (seconds) into milliseconds. */
export function parseDurationMs(value: string): number {
  const match = /^(\d+)(ms|s|m|h|d)?$/.exec(value.trim());
  if (!match) {
    throw new Error(`Invalid duration "${value}"`);
  }
  const amount = Number(match[1]);
  const unit = match[2] ?? 's';
  return amount * UNIT_MS[unit];
}
