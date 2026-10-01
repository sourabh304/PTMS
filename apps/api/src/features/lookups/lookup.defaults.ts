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
  { type: LookupType.PROJECT_STATUS, name: 'Planning', color: '#6366f1', category: StatusCategory.OPEN, isDefault: true },
  { type: LookupType.PROJECT_STATUS, name: 'Active', color: '#0ea5e9', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.PROJECT_STATUS, name: 'On Hold', color: '#f59e0b', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.PROJECT_STATUS, name: 'Completed', color: '#22c55e', category: StatusCategory.CLOSED },
  { type: LookupType.PROJECT_STATUS, name: 'Cancelled', color: '#94a3b8', category: StatusCategory.CLOSED },

  { type: LookupType.TASK_STATUS, name: 'Open', color: '#64748b', category: StatusCategory.OPEN, isDefault: true },
  { type: LookupType.TASK_STATUS, name: 'In Progress', color: '#0ea5e9', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.TASK_STATUS, name: 'In Review', color: '#a855f7', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.TASK_STATUS, name: 'Completed', color: '#22c55e', category: StatusCategory.CLOSED },

  { type: LookupType.ISSUE_STATUS, name: 'Open', color: '#ef4444', category: StatusCategory.OPEN, isDefault: true },
  { type: LookupType.ISSUE_STATUS, name: 'In Progress', color: '#0ea5e9', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.ISSUE_STATUS, name: 'To be Tested', color: '#a855f7', category: StatusCategory.IN_PROGRESS },
  { type: LookupType.ISSUE_STATUS, name: 'Closed', color: '#22c55e', category: StatusCategory.CLOSED },

  { type: LookupType.PRIORITY, name: 'None', color: '#94a3b8' },
  { type: LookupType.PRIORITY, name: 'Low', color: '#22c55e' },
  { type: LookupType.PRIORITY, name: 'Medium', color: '#f59e0b', isDefault: true },
  { type: LookupType.PRIORITY, name: 'High', color: '#f97316' },
  { type: LookupType.PRIORITY, name: 'Critical', color: '#dc2626' },

  { type: LookupType.ISSUE_SEVERITY, name: 'Minor', color: '#22c55e' },
  { type: LookupType.ISSUE_SEVERITY, name: 'Major', color: '#f59e0b', isDefault: true },
  { type: LookupType.ISSUE_SEVERITY, name: 'Critical', color: '#f97316' },
  { type: LookupType.ISSUE_SEVERITY, name: 'Show Stopper', color: '#dc2626' },
];
