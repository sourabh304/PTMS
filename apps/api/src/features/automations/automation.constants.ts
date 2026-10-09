/**
 * What an automation listens for and what it does. Each entry says which kind of value
 * (if any) narrows the trigger or parameterizes the action; the UI reads the same lists.
 */
export type AutomationValueKind = 'status' | 'priority' | 'user' | 'group' | 'days' | null;

export const AutomationTrigger = {
  ITEM_CREATED: 'ITEM_CREATED',
  STATUS_CHANGED: 'STATUS_CHANGED',
  PRIORITY_CHANGED: 'PRIORITY_CHANGED',
  ASSIGNEE_ADDED: 'ASSIGNEE_ADDED',
} as const;
export type AutomationTrigger = (typeof AutomationTrigger)[keyof typeof AutomationTrigger];

export const AutomationAction = {
  SET_STATUS: 'SET_STATUS',
  SET_PRIORITY: 'SET_PRIORITY',
  ASSIGN_USER: 'ASSIGN_USER',
  MOVE_TO_GROUP: 'MOVE_TO_GROUP',
  SET_DUE_IN_DAYS: 'SET_DUE_IN_DAYS',
  NOTIFY_USER: 'NOTIFY_USER',
  NOTIFY_ASSIGNEES: 'NOTIFY_ASSIGNEES',
  NOTIFY_CREATOR: 'NOTIFY_CREATOR',
} as const;
export type AutomationAction = (typeof AutomationAction)[keyof typeof AutomationAction];

/** Value that optionally narrows each trigger (null value = any). */
export const TRIGGER_VALUE: Record<AutomationTrigger, AutomationValueKind> = {
  ITEM_CREATED: null,
  STATUS_CHANGED: 'status',
  PRIORITY_CHANGED: 'priority',
  ASSIGNEE_ADDED: 'user',
};

/** Parameter each action requires. */
export const ACTION_VALUE: Record<AutomationAction, AutomationValueKind> = {
  SET_STATUS: 'status',
  SET_PRIORITY: 'priority',
  ASSIGN_USER: 'user',
  MOVE_TO_GROUP: 'group',
  SET_DUE_IN_DAYS: 'days',
  NOTIFY_USER: 'user',
  NOTIFY_ASSIGNEES: null,
  NOTIFY_CREATOR: null,
};

/** Automations triggered by other automations stop after this many hops (prevents loops). */
export const MAX_AUTOMATION_DEPTH = 3;
