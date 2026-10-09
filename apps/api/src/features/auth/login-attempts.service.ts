import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

interface Attempts {
  failures: number;
  /** When the counting window started; failures older than the lockout window are forgotten. */
  since: number;
  /** Set once `maxFailures` is reached: sign-ins are refused until then. */
  lockedUntil?: number;
}

/** Entries kept before expired ones are swept, so the map cannot grow without bound. */
const SWEEP_THRESHOLD = 1000;

/**
 * Limits failed sign-ins per account. The per-IP throttler alone can be bypassed by rotating
 * client addresses, so password guessing is also capped for each email address.
 */
@Injectable()
export class LoginAttemptsService {
  private readonly attempts = new Map<string, Attempts>();
  private readonly maxFailures: number;
  private readonly lockoutMs: number;

  constructor(config: ConfigService<AppConfig, true>) {
    const throttle = config.get('throttle', { infer: true });
    this.maxFailures = throttle.loginMaxFailures;
    this.lockoutMs = throttle.loginLockoutMs;
  }

  /**
   * Counts a sign-in attempt, throwing 429 while the account is locked. Attempts are counted before the
   * password is checked, so parallel guesses cannot all slip past the limit; `reset` once it is right.
   */
  recordAttempt(email: string, now = Date.now()): void {
    if (this.attempts.size > SWEEP_THRESHOLD) this.sweep(now);
    const entry = this.current(email, now) ?? { failures: 0, since: now };
    if (entry.lockedUntil) {
      const minutes = Math.max(1, Math.ceil((entry.lockedUntil - now) / 60_000));
      throw new HttpException(
        `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    entry.failures += 1;
    // The lock runs for the whole lockout period from the last allowed attempt.
    if (entry.failures >= this.maxFailures) entry.lockedUntil = now + this.lockoutMs;
    this.attempts.set(email, entry);
  }

  reset(email: string): void {
    this.attempts.delete(email);
  }

  private current(email: string, now: number): Attempts | undefined {
    const entry = this.attempts.get(email);
    if (entry && this.expired(entry, now)) {
      this.attempts.delete(email);
      return undefined;
    }
    return entry;
  }

  private expired(entry: Attempts, now: number): boolean {
    return now >= (entry.lockedUntil ?? entry.since + this.lockoutMs);
  }

  private sweep(now: number): void {
    for (const [email, entry] of this.attempts) if (this.expired(entry, now)) this.attempts.delete(email);
  }
}
