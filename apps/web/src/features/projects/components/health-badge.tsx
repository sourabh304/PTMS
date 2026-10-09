import { ProjectHealth } from '@/shared/constants/domain';
import { Badge } from '@/shared/ui/badge';

const HEALTH_DISPLAY: Record<ProjectHealth, { label: string; tone: 'success' | 'warning' | 'danger' | 'neutral'; hint: string }> = {
  [ProjectHealth.ON_TRACK]: { label: 'On track', tone: 'success', hint: 'No significant overdue work or budget overrun' },
  [ProjectHealth.AT_RISK]: { label: 'At risk', tone: 'warning', hint: 'Over 10% of open tasks overdue, or over 90% of the budget used' },
  [ProjectHealth.OFF_TRACK]: { label: 'Off track', tone: 'danger', hint: 'Past its end date, over 25% of open tasks overdue, or over budget' },
  [ProjectHealth.COMPLETED]: { label: 'Completed', tone: 'neutral', hint: 'The project is closed' },
};

export function HealthBadge({ health }: { health?: ProjectHealth }) {
  if (!health) return null;
  const display = HEALTH_DISPLAY[health];
  return (
    <span title={display.hint} className="inline-flex">
      <Badge tone={display.tone}>{display.label}</Badge>
    </span>
  );
}
