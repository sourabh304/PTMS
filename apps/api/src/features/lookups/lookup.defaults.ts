import { LookupType, StatusCategory } from '../../common/constants/domain.constants';

export interface LookupSeed {
  type: LookupType;
  name: string;
  color: string;
  category?: StatusCategory;
  isDefault?: boolean;
}

/**
 * Starter workflow provisioned for every new organization.
 * Every value is editable afterwards from Settings → Workflow.
 */
export const DEFAULT_LOOKUPS: LookupSeed[] = [
  { type: LookupType.PROJECT_STATUS, name: 'Planning', color: '#579bfc', category: StatusCategory.OPEN, isDefault: true },
  { type: LookupType.PROJECT_STATUS, name: 'Active', color: '#fdab3d', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.PROJECT_STATUS, name: 'On Hold', color: '#e2445c', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.PROJECT_STATUS, name: 'Completed', color: '#00c875', category: StatusCategory.CLOSED },
  { type: LookupType.PROJECT_STATUS, name: 'Cancelled', color: '#a6a6a6', category: StatusCategory.CLOSED },

  { type: LookupType.TASK_STATUS, name: 'Open', color: '#a6a6a6', category: StatusCategory.OPEN, isDefault: true },
  { type: LookupType.TASK_STATUS, name: 'In Progress', color: '#fdab3d', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.TASK_STATUS, name: 'In Review', color: '#a25ddc', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.TASK_STATUS, name: 'Stuck', color: '#e2445c', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.TASK_STATUS, name: 'Completed', color: '#00c875', category: StatusCategory.CLOSED },

  { type: LookupType.ISSUE_STATUS, name: 'Open', color: '#e2445c', category: StatusCategory.OPEN, isDefault: true },
  { type: LookupType.ISSUE_STATUS, name: 'In Progress', color: '#fdab3d', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.ISSUE_STATUS, name: 'To be Tested', color: '#a25ddc', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.ISSUE_STATUS, name: 'Closed', color: '#00c875', category: StatusCategory.CLOSED },

  { type: LookupType.PRIORITY, name: 'None', color: '#a6a6a6' },
  { type: LookupType.PRIORITY, name: 'Low', color: '#579bfc' },
  { type: LookupType.PRIORITY, name: 'Medium', color: '#5559df', isDefault: true },
  { type: LookupType.PRIORITY, name: 'High', color: '#401694' },
  { type: LookupType.PRIORITY, name: 'Critical', color: '#333333' },

  { type: LookupType.ISSUE_SEVERITY, name: 'Minor', color: '#579bfc' },
  { type: LookupType.ISSUE_SEVERITY, name: 'Major', color: '#fdab3d', isDefault: true },
  { type: LookupType.ISSUE_SEVERITY, name: 'Critical', color: '#ff642e' },
  { type: LookupType.ISSUE_SEVERITY, name: 'Show Stopper', color: '#e2445c' },
];
