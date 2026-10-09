'use client';

import { useSession } from '@/features/auth/api';
import { routes } from '@/shared/config/routes';
import { LinkTabs, type TabItem } from '@/shared/ui/layout';

const TABS: TabItem[] = [
  { href: routes.settingsOrganization, label: 'Organization' },
  { href: routes.settingsUsers, label: 'Users' },
  { href: routes.settingsWorkflow, label: 'Workflow' },
];

/** Settings navigation; the Workspaces tab is shown to the root administrator only. */
export function SettingsTabs({ className }: { className?: string }) {
  const { data: session } = useSession();
  const items = session?.isRootAdmin ? [...TABS, { href: routes.settingsWorkspaces, label: 'Workspaces' }] : TABS;
  return <LinkTabs items={items} className={className} />;
}
