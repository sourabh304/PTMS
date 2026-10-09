import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { SettingsNav } from '@/shared/components/settings-nav';
import { PageHeader } from '@/shared/ui/layout';

export const metadata: Metadata = { title: { default: 'Settings', template: `%s · ${appConfig.name}` } };

export default function SettingsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <PageHeader title="Settings" description="Manage your workspace, people, workflows and personal preferences." />
      <SettingsNav />
      {children}
    </>
  );
}
