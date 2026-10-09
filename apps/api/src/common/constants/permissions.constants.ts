import { OrgRole } from './roles.constants';

/**
 * Capabilities granted by a user's role inside their workspace. Project-level access
 * (who can see, edit or manage a project) is enforced separately by ProjectAccessService.
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

export const ROLE_PERMISSIONS: Record<OrgRole, readonly Permission[]> = {
  [OrgRole.PROJECT_MANAGER]: Object.values(Permission),
  // Employees work inside the projects they belong to and can see who is in the workspace.
  [OrgRole.EMPLOYEE]: [Permission.USERS_VIEW],
};

export const permissionsForRole = (role: string): readonly Permission[] => ROLE_PERMISSIONS[role as OrgRole] ?? [];

export const hasPermission = (role: string, permission: Permission): boolean => permissionsForRole(role).includes(permission);
