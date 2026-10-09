import type { Metadata } from 'next';
import { WorkspaceManagement } from '@/features/workspaces/components/workspace-management';

export const metadata: Metadata = { title: 'Workspaces' };

export default function WorkspacesPage() {
  return <WorkspaceManagement />;
}
