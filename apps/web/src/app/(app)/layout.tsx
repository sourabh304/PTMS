import type { ReactNode } from 'react';
import { AppShell } from '@/shared/components/app-shell';

export default function AuthenticatedLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
