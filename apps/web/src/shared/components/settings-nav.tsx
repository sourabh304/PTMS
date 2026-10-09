'use client';

import { usePermissions } from '@/features/auth/hooks/use-permissions';
import { SETTINGS_NAVIGATION } from '@/shared/config/navigation';
import { LinkTabs } from '@/shared/ui/layout';

/** Settings tabs, filtered by the current user's permissions. */
export function SettingsNav() {
  const { can } = usePermissions();
  const items = SETTINGS_NAVIGATION.filter((item) => !item.permission || can(item.permission));
  return <LinkTabs items={items} className="mb-6" />;
}
