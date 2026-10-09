/** Mirrors apps/api/src/features/automations/automation.constants.ts. */
export type AutomationValueKind = 'status' | 'priority' | 'user' | 'group' | 'days' | null;

export const TRIGGERS = {
  ITEM_CREATED: { label: 'an item is created', value: null, valueLabel: '' },
  STATUS_CHANGED: { label: 'status changes to', value: 'status', valueLabel: 'any status' },
  PRIORITY_CHANGED: { label: 'priority changes to', value: 'priority', valueLabel: 'any priority' },
  ASSIGNEE_ADDED: { label: 'an item is assigned to', value: 'user', valueLabel: 'anyone' },
} as const satisfies Record<string, { label: string; value: AutomationValueKind; valueLabel: string }>;

export const ACTIONS = {
  SET_STATUS: { label: 'set status to', value: 'status' },
  SET_PRIORITY: { label: 'set priority to', value: 'priority' },
  ASSIGN_USER: { label: 'assign', value: 'user' },
  MOVE_TO_GROUP: { label: 'move the item to group', value: 'group' },
  SET_DUE_IN_DAYS: { label: 'set the due date to today +', value: 'days' },
  NOTIFY_USER: { label: 'notify', value: 'user' },
  NOTIFY_ASSIGNEES: { label: 'notify the assignees', value: null },
  NOTIFY_CREATOR: { label: 'notify the item creator', value: null },
} as const satisfies Record<string, { label: string; value: AutomationValueKind }>;

export type AutomationTrigger = keyof typeof TRIGGERS;
export type AutomationAction = keyof typeof ACTIONS;

export interface Automation {
  id: string;
  projectId: string;
  name: string;
  trigger: AutomationTrigger;
  triggerValue: string | null;
  action: AutomationAction;
  actionValue: string | null;
  isActive: boolean;
  runCount: number;
  lastRunAt: string | null;
  createdAt: string;
  createdBy: { id: string; firstName: string; lastName: string };
}

export interface AutomationInput {
  name: string;
  trigger: AutomationTrigger;
  triggerValue: string | null;
  action: AutomationAction;
  actionValue: string | null;
  isActive?: boolean;
}
