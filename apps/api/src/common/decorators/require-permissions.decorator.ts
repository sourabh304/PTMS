import { SetMetadata } from '@nestjs/common';
import { Permission } from '../constants/permissions.constants';

export const PERMISSIONS_KEY = 'permissions';

/** Requires the current user's organization role to grant every listed permission. */
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
