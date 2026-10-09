import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

/** Allows only the platform root administrator (runs after the global JWT guard). */
@Injectable()
export class RootAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    if (!user?.isRootAdmin) {
      throw new ForbiddenException('Only the root administrator can manage workspaces');
    }
    return true;
  }
}
