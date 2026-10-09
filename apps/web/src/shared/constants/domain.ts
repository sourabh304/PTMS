/**
 * Mirrors of the API's enumerated values (apps/api/src/common/constants).
 * Display names for configurable values (statuses, priorities…) always come from the API.
 */
export const Permission = {
  ORG_MANAGE: 'org:manage',
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  LOOKUPS_MANAGE: 'lookups:manage',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_VIEW_ALL: 'projects:view-all',
  TIMESHEETS_APPROVE: 'timesheets:approve',
  TIMESHEETS_VIEW_ALL: 'timesheets:view-all',
  REPORTS_VIEW: 'reports:view',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

export const ORG_ROLES = ['ADMIN', 'EMPLOYEE'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const PROJECT_ROLES = ['MANAGER', 'MEMBER', 'VIEWER'] as const;
export type ProjectRole = (typeof PROJECT_ROLES)[number];

export const LookupType = {
  PROJECT_STATUS: 'PROJECT_STATUS',
  TASK_STATUS: 'TASK_STATUS',
  ISSUE_STATUS: 'ISSUE_STATUS',
  PRIORITY: 'PRIORITY',
  ISSUE_SEVERITY: 'ISSUE_SEVERITY',
} as const;
export type LookupType = (typeof LookupType)[keyof typeof LookupType];

export const StatusCategory = {
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  CLOSED: 'CLOSED',
} as const;
export type StatusCategory = (typeof StatusCategory)[keyof typeof StatusCategory];

export const ApprovalStatus = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
} as const;
export type ApprovalStatus = (typeof ApprovalStatus)[keyof typeof ApprovalStatus];

export const ProjectHealth = {
  ON_TRACK: 'ON_TRACK',
  AT_RISK: 'AT_RISK',
  OFF_TRACK: 'OFF_TRACK',
  COMPLETED: 'COMPLETED',
} as const;
export type ProjectHealth = (typeof ProjectHealth)[keyof typeof ProjectHealth];
