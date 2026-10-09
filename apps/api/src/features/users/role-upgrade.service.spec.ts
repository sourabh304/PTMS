import { Logger } from '@nestjs/common';
import { LEGACY_ORG_ROLES } from '../../common/constants/roles.constants';
import { RoleUpgradeService, upgradeLegacyRoles } from './role-upgrade.service';

function setup({ users = 0, projectMembers = 0 } = {}) {
  return {
    user: { updateMany: jest.fn().mockResolvedValue({ count: users }) },
    projectMember: { updateMany: jest.fn().mockResolvedValue({ count: projectMembers }) },
  };
}

describe('upgradeLegacyRoles', () => {
  it('maps every legacy organization role and resets project roles to MEMBER', async () => {
    const prisma = setup({ users: 1, projectMembers: 2 });
    const changed = await upgradeLegacyRoles(prisma as never);

    for (const [legacy, role] of Object.entries(LEGACY_ORG_ROLES)) {
      expect(prisma.user.updateMany).toHaveBeenCalledWith({ where: { role: legacy }, data: { role } });
    }
    expect(prisma.projectMember.updateMany).toHaveBeenCalledWith({ where: { role: { not: 'MEMBER' } }, data: { role: 'MEMBER' } });
    expect(changed).toBe(Object.keys(LEGACY_ORG_ROLES).length + 2);
  });
});

describe('RoleUpgradeService.onApplicationBootstrap', () => {
  afterEach(() => jest.restoreAllMocks());

  it('logs only when something was upgraded', async () => {
    const log = jest.spyOn(Logger.prototype, 'log').mockImplementation();
    await new RoleUpgradeService(setup() as never).onApplicationBootstrap();
    expect(log).not.toHaveBeenCalled();

    await new RoleUpgradeService(setup({ projectMembers: 3 }) as never).onApplicationBootstrap();
    expect(log).toHaveBeenCalledWith('Upgraded 3 legacy role assignments');
  });

  it('does not stop the start-up when the upgrade fails', async () => {
    const warn = jest.spyOn(Logger.prototype, 'warn').mockImplementation();
    const prisma = setup();
    prisma.user.updateMany.mockRejectedValue(new Error('database is locked'));
    await expect(new RoleUpgradeService(prisma as never).onApplicationBootstrap()).resolves.toBeUndefined();
    expect(warn).toHaveBeenCalledWith('Could not upgrade legacy roles: database is locked');
  });
});
