/** Organization-wide roles, ordered from most to least privileged. */
export const OrgRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  GUEST: 'GUEST',
} as const;
export type OrgRole = (typeof OrgRole)[keyof typeof OrgRole];
export const ORG_ROLES = Object.values(OrgRole);

/** Roles a user can hold inside a single project. */
export const ProjectRole = {
  MANAGER: 'MANAGER',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;
export type ProjectRole = (typeof ProjectRole)[keyof typeof ProjectRole];
export const PROJECT_ROLES = Object.values(ProjectRole);

export const ORG_ADMIN_ROLES: readonly OrgRole[] = [OrgRole.OWNER, OrgRole.ADMIN];
export const PROJECT_EDITOR_ROLES: readonly ProjectRole[] = [ProjectRole.MANAGER, ProjectRole.MEMBER];

export const isOrgAdmin = (role: string): boolean => ORG_ADMIN_ROLES.includes(role as OrgRole);
