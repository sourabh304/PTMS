import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { routes } from '@/shared/config/routes';
import { LinkTabs, PageHeader } from '@/shared/ui/layout';

export const metadata: Metadata = { title: 'Settings' };

const TABS = [
  { href: routes.settingsOrganization, label: 'Organization' },
  { href: routes.settingsUsers, label: 'Users' },
  { href: routes.settingsWorkflow, label: 'Workflow' },
];

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Configure your workspace, people and workflows." />
      <LinkTabs items={TABS} className="mb-6" />
      {children}
    </>
  );
}
