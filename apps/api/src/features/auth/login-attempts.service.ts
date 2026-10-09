import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '../../config/configuration';

interface Attempts {
  failures: number;
  /** When the counting window started; failures older than the lockout window are forgotten. */
  since: number;
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
  private readonly windowMs: number;

  constructor(config: ConfigService<AppConfig, true>) {
    const throttle = config.get('throttle', { infer: true });
    this.maxFailures = throttle.loginMaxFailures;
    this.windowMs = throttle.loginLockoutMs;
  }

  /** Throws 429 while the account is locked after too many failures. */
  assertAllowed(email: string, now = Date.now()): void {
    const entry = this.current(email, now);
    if (entry && entry.failures >= this.maxFailures) {
      const minutes = Math.max(1, Math.ceil((entry.since + this.windowMs - now) / 60_000));
      throw new HttpException(
        `Too many failed sign-in attempts. Try again in ${minutes} minute${minutes === 1 ? '' : 's'}.`,
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  }

  recordFailure(email: string, now = Date.now()): void {
    if (this.attempts.size > SWEEP_THRESHOLD) this.sweep(now);
    const entry = this.current(email, now);
    this.attempts.set(email, entry ? { ...entry, failures: entry.failures + 1 } : { failures: 1, since: now });
  }

  reset(email: string): void {
    this.attempts.delete(email);
  }

  private current(email: string, now: number): Attempts | undefined {
    const entry = this.attempts.get(email);
    if (entry && now - entry.since >= this.windowMs) {
      this.attempts.delete(email);
      return undefined;
    }
    return entry;
  }

  private sweep(now: number): void {
    for (const [email, entry] of this.attempts) if (now - entry.since >= this.windowMs) this.attempts.delete(email);
  }
}
