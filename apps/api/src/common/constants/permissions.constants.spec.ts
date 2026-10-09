import { hasPermission, Permission } from './permissions.constants';
import { isCoordinator, normalizeRole, OrgRole, PlatformRole } from './roles.constants';

describe('role permissions', () => {
  it('gives root every coordinator permission plus organization and coordinator management', () => {
    for (const permission of Object.values(Permission)) expect(hasPermission(PlatformRole.ROOT, permission)).toBe(true);
  });

  it('lets coordinators run projects, people and meetings but not appoint coordinators', () => {
    expect(hasPermission(OrgRole.PROJECT_COORDINATOR, Permission.PROJECTS_CREATE)).toBe(true);
    expect(hasPermission(OrgRole.PROJECT_COORDINATOR, Permission.USERS_MANAGE)).toBe(true);
    expect(hasPermission(OrgRole.PROJECT_COORDINATOR, Permission.MEETINGS_MANAGE)).toBe(true);
    expect(hasPermission(OrgRole.PROJECT_COORDINATOR, Permission.COORDINATORS_MANAGE)).toBe(false);
    expect(hasPermission(OrgRole.PROJECT_COORDINATOR, Permission.PLATFORM_MANAGE)).toBe(false);
  });

  it('keeps members to their own projects', () => {
    expect(hasPermission(OrgRole.MEMBER, Permission.PROJECTS_VIEW_ALL)).toBe(false);
    expect(hasPermission(OrgRole.MEMBER, Permission.PROJECTS_CREATE)).toBe(false);
    expect(hasPermission(OrgRole.MEMBER, Permission.MEETINGS_MANAGE)).toBe(false);
    expect(hasPermission(OrgRole.MEMBER, Permission.USERS_MANAGE)).toBe(false);
  });

  it('maps roles stored by earlier versions', () => {
    expect(normalizeRole('SUPER_ADMIN')).toBe(OrgRole.PROJECT_COORDINATOR);
    expect(normalizeRole('ADMIN')).toBe(OrgRole.PROJECT_COORDINATOR);
    expect(normalizeRole('EMPLOYEE')).toBe(OrgRole.MEMBER);
    expect(hasPermission('ADMIN', Permission.PROJECTS_CREATE)).toBe(true);
    expect(isCoordinator('SUPER_ADMIN')).toBe(true);
    expect(isCoordinator(OrgRole.MEMBER)).toBe(false);
  });
});
