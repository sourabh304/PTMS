import { StatusCategory } from '../../common/constants/domain.constants';

/** Thresholds used to classify project health (projects list, reports). */
export const PROJECT_HEALTH_RULES = {
  /** Share of overdue open tasks above which a project is "at risk". */
  atRiskOverdueRatio: 0.1,
  /** Share of overdue open tasks above which a project is "off track". */
  offTrackOverdueRatio: 0.25,
  /** Logged/budget hours ratio above which a project is "at risk". */
  atRiskBudgetRatio: 0.9,
  /** Default reporting window (days) when no range is given. */
  defaultRangeDays: 30,
} as const;

export const ProjectHealth = {
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  OFF_TRACK: 'OFF_TRACK',
  COMPLETED: 'COMPLETED',
} as const;
export type ProjectHealth = (typeof ProjectHealth)[keyof typeof ProjectHealth];

export interface HealthInput {
  statusCategory: string | null;
  openTasks: number;
  overdueTasks: number;
  endDate: Date | null;
  budgetHours: number | null;
  loggedMinutes: number;
}

/** Classifies a project from its schedule, overdue work and budget burn. */
export function evaluateProjectHealth(input: HealthInput, now = new Date()): ProjectHealth {
  if (input.statusCategory === StatusCategory.CLOSED) return ProjectHealth.COMPLETED;
  const overdueRatio = input.openTasks ? input.overdueTasks / input.openTasks : 0;
  const budgetRatio = input.budgetHours ? input.loggedMinutes / 60 / input.budgetHours : 0;
  const pastDeadline = !!input.endDate && input.endDate < now && input.openTasks > 0;
  if (pastDeadline || overdueRatio > PROJECT_HEALTH_RULES.offTrackOverdueRatio || budgetRatio > 1) {
    return ProjectHealth.OFF_TRACK;
  }
  if (overdueRatio > PROJECT_HEALTH_RULES.atRiskOverdueRatio || budgetRatio > PROJECT_HEALTH_RULES.atRiskBudgetRatio) {
    return ProjectHealth.AT_RISK;
  }
  return ProjectHealth.ON_TRACK;
}
