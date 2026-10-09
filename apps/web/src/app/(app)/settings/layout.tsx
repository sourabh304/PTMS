import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { SettingsTabs } from '@/features/workspaces/components/settings-tabs';
import { PageHeader } from '@/shared/ui/layout';

export const metadata: Metadata = { title: 'Settings' };

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Configure your workspace, people and workflows." />
      <SettingsTabs className="mb-6" />
      {children}
    </>
  );
}
