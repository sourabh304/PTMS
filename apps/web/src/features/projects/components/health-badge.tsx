import { ProjectHealth } from '@/shared/constants/domain';
import { Badge } from '@/shared/ui/badge';

const HEALTH_DISPLAY: Record<ProjectHealth, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral' }> = {
  [ProjectHealth.ON_TRACK]: { label: 'On track', tone: 'success' },
  [ProjectHealth.AT_RISK]: { label: 'At risk', tone: 'warning' },
  [ProjectHealth.OFF_TRACK]: { label: 'Off track', tone: 'danger' },
  [ProjectHealth.COMPLETED]: { label: 'Completed', tone: 'neutral' },
};

export function HealthBadge({ health }: { health?: ProjectHealth }) {
  if (!health) return null;
  const display = HEALTH_DISPLAY[health];
  return <Badge tone={display.tone}>{display.label}</Badge>;
}
