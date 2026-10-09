import { SetMetadata } from '@nestjs/common';

/**
 * Which kind of account may call a route:
 * - `tenant` (default): organization users only
 * - `platform`: the root account only
 * - `any`: both (e.g. reading or editing your own profile)
 */
export const AccountScope = {
  TENANT: 'tenant',
  PLATFORM: 'platform',
  ANY: 'any',
} as const;
export type AccountScope = (typeof AccountScope)[keyof typeof AccountScope];

export const ACCOUNT_SCOPE_KEY = 'accountScope';

export const ForAccounts = (scope: AccountScope) => SetMetadata(ACCOUNT_SCOPE_KEY, scope);

/** Shorthand for root-only platform routes. */
export const PlatformOnly = () => ForAccounts(AccountScope.PLATFORM);
