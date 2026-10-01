import { applyDecorators } from '@nestjs/common';
import { IsStrongPassword, MaxLength } from 'class-validator';

export const PASSWORD_POLICY = {
  minLength: 8,
  maxLength: 128,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 0,
} as const;

export const PASSWORD_POLICY_MESSAGE = `Password must be at least ${PASSWORD_POLICY.minLength} characters and include upper-case, lower-case letters and a number`;

/** Shared password strength rule for every endpoint that accepts a new password. */
export const IsPassword = () =>
  applyDecorators(
    IsStrongPassword(
      {
        minLength: PASSWORD_POLICY.minLength,
        minLowercase: PASSWORD_POLICY.minLowercase,
        minUppercase: PASSWORD_POLICY.minUppercase,
        minNumbers: PASSWORD_POLICY.minNumbers,
        minSymbols: PASSWORD_POLICY.minSymbols,
      },
      { message: PASSWORD_POLICY_MESSAGE },
    ),
    MaxLength(PASSWORD_POLICY.maxLength),
  );
