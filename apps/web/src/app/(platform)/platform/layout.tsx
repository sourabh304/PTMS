import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { AppShell } from '@/shared/components/app-shell';

export const metadata: Metadata = { title: { default: 'Platform', template: `%s · ${appConfig.name}` } };

/** Root-only platform console; AppShell redirects anyone else to their workspace. */
export default function PlatformLayout({ children }: { children: ReactNode }) {
  return <AppShell variant="platform">{children}</AppShell>;
}
