import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { OrgRole, PlatformRole } from '../constants/roles.constants';
import { ACCOUNT_SCOPE_KEY, AccountScope } from '../decorators/account-scope.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { AccountScopeGuard } from './account-scope.guard';

const root = { id: 'r', role: PlatformRole.ROOT, organizationId: null };
const tenant = { id: 't', role: OrgRole.SUPER_ADMIN, organizationId: 'org-1' };

function run(user: object | undefined, metadata: { scope?: AccountScope; isPublic?: boolean }) {
  const reflector = {
    getAllAndOverride: (key: string) => (key === IS_PUBLIC_KEY ? metadata.isPublic : key === ACCOUNT_SCOPE_KEY ? metadata.scope : undefined),
  } as unknown as Reflector;
  const context = {
    getHandler: () => undefined,
    getClass: () => undefined,
    switchToHttp: () => ({ getRequest: () => ({ user }) }),
  } as unknown as ExecutionContext;
  return new AccountScopeGuard(reflector).canActivate(context);
}

describe('AccountScopeGuard', () => {
  it('lets organization users reach tenant routes (default scope)', () => {
    expect(run(tenant, {})).toBe(true);
  });

  it('keeps the root account out of tenant routes until it opens a workspace', () => {
    expect(() => run(root, {})).toThrow(ForbiddenException);
    expect(run({ ...root, organizationId: 'org-1' }, {})).toBe(true);
  });

  it('reserves platform routes for the root account', () => {
    expect(run(root, { scope: AccountScope.PLATFORM })).toBe(true);
    expect(run({ ...root, organizationId: 'org-1' }, { scope: AccountScope.PLATFORM })).toBe(true);
    expect(() => run(tenant, { scope: AccountScope.PLATFORM })).toThrow(ForbiddenException);
  });

  it('allows both account kinds on shared routes', () => {
    expect(run(root, { scope: AccountScope.ANY })).toBe(true);
    expect(run(tenant, { scope: AccountScope.ANY })).toBe(true);
  });

  it('skips public routes', () => {
    expect(run(undefined, { isPublic: true })).toBe(true);
  });
});
