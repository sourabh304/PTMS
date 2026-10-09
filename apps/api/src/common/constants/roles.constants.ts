/** Workspace roles: Project Managers run the workspace, Employees work on their projects. */
export const OrgRole = {
  PROJECT_MANAGER: 'PROJECT_MANAGER',
  EMPLOYEE: 'EMPLOYEE',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];
export const ORG_ROLES = Object.values(OrgRole);

/** Roles stored by earlier versions and the role each one now maps to (applied by the seed). */
export const LEGACY_ORG_ROLES: Record<string, OrgRole> = {
  SUPER_ADMIN: OrgRole.PROJECT_MANAGER,
  ADMIN: OrgRole.PROJECT_MANAGER,
  OWNER: OrgRole.PROJECT_MANAGER,
  MANAGER: OrgRole.PROJECT_MANAGER,
  MEMBER: OrgRole.EMPLOYEE,
  GUEST: OrgRole.EMPLOYEE,
};

/** Platform account of earlier versions; such accounts are retired by the seed. */
export const LEGACY_ROOT_ROLE = 'ROOT';

export const isProjectManager = (role: string): boolean => role === OrgRole.PROJECT_MANAGER;
