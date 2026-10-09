import { StatusCategory } from '../../common/constants/domain.constants';
import { evaluateProjectHealth, ProjectHealth } from './project-health';

const base = { statusCategory: StatusCategory.IN_PROGRESS, openTasks: 10, overdueTasks: 0, endDate: null, budgetHours: null, loggedMinutes: 0 };
const now = new Date('2026-10-01T00:00:00Z');

describe('evaluateProjectHealth', () => {
  it('is on track without overdue work', () => {
    expect(evaluateProjectHealth(base, now)).toBe(ProjectHealth.ON_TRACK);
  });

  it('is at risk when more than 10% of open tasks are overdue', () => {
    expect(evaluateProjectHealth({ ...base, overdueTasks: 2 }, now)).toBe(ProjectHealth.AT_RISK);
  });

  it('is off track past the end date with open work', () => {
    expect(evaluateProjectHealth({ ...base, endDate: new Date('2026-09-01') }, now)).toBe(ProjectHealth.OFF_TRACK);
  });

  it('is off track when over budget', () => {
    expect(evaluateProjectHealth({ ...base, budgetHours: 10, loggedMinutes: 11 * 60 }, now)).toBe(ProjectHealth.OFF_TRACK);
  });

  it('is completed for closed statuses', () => {
    expect(evaluateProjectHealth({ ...base, statusCategory: StatusCategory.CLOSED, overdueTasks: 9 }, now)).toBe(ProjectHealth.COMPLETED);
  });
});
