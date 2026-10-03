import { OrgRole, PlatformRole } from './roles.constants';

/**
 * Capabilities granted by a user's role. Organization permissions apply inside the user's own
 * organization; project-level access is enforced separately by ProjectAccessService.
 */
export const Permission = {
  // Platform (root only)
  PLATFORM_MANAGE: 'platform:manage',
  // Organization
  ORG_MANAGE: 'org:manage',
  USERS_VIEW: 'users:view',
  USERS_MANAGE: 'users:manage',
  LOOKUPS_MANAGE: 'lookups:manage',
  PROJECTS_CREATE: 'projects:create',
  PROJECTS_VIEW_ALL: 'projects:view-all',
  TIMESHEETS_APPROVE: 'timesheets:approve',
  TIMESHEETS_VIEW_ALL: 'timesheets:view-all',
  REPORTS_VIEW: 'reports:view',
  SUBSCRIPTION_VIEW: 'subscription:view',
} as const;
export type Permission = (typeof Permission)[keyof typeof Permission];

const ORGANIZATION_ADMIN_PERMISSIONS: readonly Permission[] = [
  Permission.ORG_MANAGE,
  Permission.USERS_VIEW,
  Permission.USERS_MANAGE,
  Permission.LOOKUPS_MANAGE,
  Permission.PROJECTS_CREATE,
  Permission.PROJECTS_VIEW_ALL,
  Permission.TIMESHEETS_APPROVE,
  Permission.TIMESHEETS_VIEW_ALL,
  Permission.REPORTS_VIEW,
  Permission.SUBSCRIPTION_VIEW,
];

export const ROLE_PERMISSIONS: Record<OrgRole | PlatformRole, readonly Permission[]> = {
  [PlatformRole.ROOT]: [Permission.PLATFORM_MANAGE],
  [OrgRole.SUPER_ADMIN]: ORGANIZATION_ADMIN_PERMISSIONS,
  [OrgRole.ADMIN]: ORGANIZATION_ADMIN_PERMISSIONS,
  [OrgRole.EMPLOYEE]: [Permission.USERS_VIEW],
};

export const permissionsForRole = (role: string): readonly Permission[] =>
  ROLE_PERMISSIONS[role as OrgRole | PlatformRole] ?? [];

export const hasPermission = (role: string, permission: Permission): boolean =>
  permissionsForRole(role).includes(permission);
