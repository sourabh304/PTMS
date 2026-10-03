import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import type { Request } from 'express';
import { isRoot } from '../constants/roles.constants';
import { ACCOUNT_SCOPE_KEY, AccountScope } from '../decorators/account-scope.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { Principal } from '../interfaces/authenticated-user.interface';

/**
 * Keeps the platform and tenant worlds apart: the root account can only reach platform routes
 * (and shared "any" routes), organization users can never reach platform routes.
 */
@Injectable()
export class AccountScopeGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const targets = [context.getHandler(), context.getClass()];
    if (this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, targets)) return true;

    const scope = this.reflector.getAllAndOverride<AccountScope>(ACCOUNT_SCOPE_KEY, targets) ?? AccountScope.TENANT;
    if (scope === AccountScope.ANY) return true;

    const { user } = context.switchToHttp().getRequest<Request & { user?: Principal }>();
    const root = !!user && isRoot(user.role);
    if (scope === AccountScope.PLATFORM && !root) {
      throw new ForbiddenException('This action requires the platform root account');
    }
    if (scope === AccountScope.TENANT && (root || !user?.organizationId)) {
      throw new ForbiddenException('This action is only available inside an organization');
    }
    return true;
  }
}
