/** Thresholds used to classify project health in reports. */
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
