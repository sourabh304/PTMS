import { HttpException, HttpStatus } from '@nestjs/common';
import { LoginAttemptsService } from './login-attempts.service';

const EMAIL = 'qa@example.com';
const MINUTE = 60_000;
const start = Date.UTC(2026, 9, 9, 12);

function setup(loginMaxFailures = 3, lockoutMinutes = 15) {
  const config = { get: () => ({ loginMaxFailures, loginLockoutMs: lockoutMinutes * MINUTE }) };
  return new LoginAttemptsService(config as never);
}

/** The status and message thrown by an attempt, or null when it is allowed. */
function attempt(service: LoginAttemptsService, now: number, email = EMAIL) {
  try {
    service.recordAttempt(email, now);
    return null;
  } catch (error) {
    return { status: (error as HttpException).getStatus(), message: (error as HttpException).message };
  }
}

describe('LoginAttemptsService', () => {
  it('locks the account after the allowed number of failed attempts', () => {
    const service = setup();
    expect([attempt(service, start), attempt(service, start + 1), attempt(service, start + 2)]).toEqual([null, null, null]);
    expect(attempt(service, start + 3)).toEqual({
      status: HttpStatus.TOO_MANY_REQUESTS,
      message: 'Too many failed sign-in attempts. Try again in 15 minutes.',
    });
  });

  it('counts attempts before the password is checked, so parallel guesses cannot slip through', () => {
    const service = setup();
    // Requests still waiting for their password check have each used up an attempt.
    const results = Array.from({ length: 10 }, () => attempt(service, start));
    expect(results.filter((result) => result === null)).toHaveLength(3);
  });

  it('keeps the account locked for the whole lockout period after the last failure', () => {
    const service = setup();
    attempt(service, start);
    attempt(service, start + 10 * MINUTE);
    attempt(service, start + 14 * MINUTE); // third failure: locked until start + 29 minutes
    expect(attempt(service, start + 20 * MINUTE)).toEqual(expect.objectContaining({ message: 'Too many failed sign-in attempts. Try again in 9 minutes.' }));
    expect(attempt(service, start + 28.5 * MINUTE)).toEqual(expect.objectContaining({ message: 'Too many failed sign-in attempts. Try again in 1 minute.' }));
    expect(attempt(service, start + 29 * MINUTE)).toBeNull();
  });

  it('forgets failures older than the lockout window', () => {
    const service = setup();
    attempt(service, start);
    attempt(service, start + MINUTE);
    // The window that started with the first failure has ended: counting starts again.
    expect([attempt(service, start + 15 * MINUTE), attempt(service, start + 16 * MINUTE), attempt(service, start + 17 * MINUTE)]).toEqual([null, null, null]);
    expect(attempt(service, start + 18 * MINUTE)).not.toBeNull();
  });

  it('starts again after a successful sign-in', () => {
    const service = setup();
    attempt(service, start);
    attempt(service, start);
    service.reset(EMAIL);
    expect([attempt(service, start), attempt(service, start), attempt(service, start)]).toEqual([null, null, null]);
  });

  it('counts each account separately', () => {
    const service = setup();
    for (let i = 0; i < 3; i++) attempt(service, start);
    expect(attempt(service, start)).not.toBeNull();
    expect(attempt(service, start, 'other@example.com')).toBeNull();
  });
});
