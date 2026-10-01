'use client';

import { useCallback } from 'react';
import type { Permission } from '@/shared/constants/domain';
import { useSession } from '../api';

/** Permission checks for UI affordances. The API remains the source of truth for enforcement. */
export function usePermissions() {
  const { data: user } = useSession();
  const can = useCallback((permission: Permission) => !!user?.permissions.includes(permission), [user]);
  return { can, user };
}
