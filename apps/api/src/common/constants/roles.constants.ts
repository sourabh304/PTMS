/** Platform-level role: manages every organization, plan and subscription. Never belongs to an organization. */
export const PlatformRole = {
  ROOT: 'ROOT',
} as const;
export type PlatformRole = (typeof PlatformRole)[keyof typeof PlatformRole];

/** Organization-wide roles, ordered from most to least privileged. */
export const OrgRole = {
  SUPER_ADMIN: 'SUPER_ADMIN',
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

export const ORG_ADMIN_ROLES: readonly OrgRole[] = [OrgRole.SUPER_ADMIN, OrgRole.ADMIN];
export const PROJECT_EDITOR_ROLES: readonly ProjectRole[] = [ProjectRole.MANAGER, ProjectRole.MEMBER];

export const isRoot = (role: string): boolean => role === PlatformRole.ROOT;
/** Root acts with super admin authority inside whichever organization it has opened. */
export const isSuperAdmin = (role: string): boolean => role === OrgRole.SUPER_ADMIN || isRoot(role);
export const isOrgAdmin = (role: string): boolean => ORG_ADMIN_ROLES.includes(role as OrgRole) || isRoot(role);
