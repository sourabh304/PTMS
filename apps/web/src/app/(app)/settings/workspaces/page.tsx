import type { Metadata } from 'next';
import { WorkspaceList } from '@/features/workspaces/components/workspace-list';

export const metadata: Metadata = { title: 'Workspaces' };

export default function WorkspacesSettingsPage() {
  return <WorkspaceList />;
}
