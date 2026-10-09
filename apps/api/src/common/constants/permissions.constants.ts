import { OrgRole } from './roles.constants';

/** Organization level capabilities. Project level access is enforced by ProjectAccessService. */
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

const ALL_PERMISSIONS = Object.values(Permission);

export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  [OrgRole.ADMIN]: ALL_PERMISSIONS,
  // Project-level rights (editing tasks, managing a project they lead) come from project roles.
  [OrgRole.EMPLOYEE]: [Permission.USERS_VIEW],
};

export const permissionsForRole = (role: string): readonly Permission[] =>
  ROLE_PERMISSIONS[role as OrgRole] ?? [];

export const hasPermission = (role: string, permission: Permission): boolean =>
  permissionsForRole(role).includes(permission);
