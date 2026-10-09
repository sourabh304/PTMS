/**
 * Workspace-wide roles. The root administrator is an ADMIN whose user record has isRootAdmin set.
 * - ADMIN: manages users, projects and settings, and sees everything in the workspace.
 * - EMPLOYEE: works on the projects they are added to and logs their own time.
 */
export const OrgRole = {
  ADMIN: 'ADMIN',
  EMPLOYEE: 'EMPLOYEE',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];
export const ORG_ROLES = Object.values(OrgRole);

/** Roles stored by earlier versions and the role each one now maps to. */
export const LEGACY_ORG_ROLES: Record<string, OrgRole> = {
  OWNER: OrgRole.ADMIN,
  MANAGER: OrgRole.ADMIN,
  MEMBER: OrgRole.EMPLOYEE,
  GUEST: OrgRole.EMPLOYEE,
};

/** Roles a user can hold inside a single project. */
export const ProjectRole = {
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];
export const PROJECT_ROLES = Object.values(ProjectRole);

export const PROJECT_EDITOR_ROLES: readonly ProjectRole[] = [ProjectRole.MANAGER, ProjectRole.MEMBER];

export const isOrgAdmin = (role: string): boolean => role === OrgRole.ADMIN;
