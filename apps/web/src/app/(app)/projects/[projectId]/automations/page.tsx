import { AutomationCenter } from '@/features/automations/components/automation-center';

export default async function ProjectAutomationsPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  return <AutomationCenter projectId={projectId} />;
}
