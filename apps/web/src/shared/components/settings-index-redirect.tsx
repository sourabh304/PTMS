'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { SETTINGS_NAVIGATION } from '@/shared/config/navigation';
import { Spinner } from '@/shared/ui/feedback';

/** Sends /settings to the most relevant section the user can access. */
export function SettingsIndexRedirect() {
  const router = useRouter();
  const { can, user } = usePermissions();
  useEffect(() => {
    if (!user) return;
    const allowed = SETTINGS_NAVIGATION.filter((item) => !item.permission || can(item.permission));
    // Prefer the first administrative section when available, otherwise personal appearance.
    const target = allowed.find((item) => item.permission) ?? allowed[0];
    router.replace(target.href);
  }, [user, can, router]);
  return <Spinner />;
}
