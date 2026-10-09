import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { LEGACY_ORG_ROLES, ProjectRole } from '../../common/constants/roles.constants';
import { PrismaService } from '../../prisma/prisma.service';

/**
 * Maps roles stored by earlier versions (super admin, admin, employee, project manager/viewer) to today's roles.
 * Shared by the API start-up and the seed; returns how many role assignments changed.
 */
export async function upgradeLegacyRoles(prisma: Pick<PrismaClient, 'user' | 'projectMember'>): Promise<number> {
  let changed = 0;
  for (const [legacy, role] of Object.entries(LEGACY_ORG_ROLES)) {
    changed += (await prisma.user.updateMany({ where: { role: legacy }, data: { role } })).count;
  }
  changed += (await prisma.projectMember.updateMany({ where: { role: { not: ProjectRole.MEMBER } }, data: { role: ProjectRole.MEMBER } })).count;
  return changed;
}

/** Upgrades legacy roles at start-up so role queries find them even when the seed has not run. */
@Injectable()
export class RoleUpgradeService implements OnApplicationBootstrap {
  private readonly logger = new Logger(RoleUpgradeService.name);

  constructor(private readonly prisma: PrismaService) {}

  async onApplicationBootstrap(): Promise<void> {
    try {
      const changed = await upgradeLegacyRoles(this.prisma);
      if (changed) this.logger.log(`Upgraded ${changed} legacy role assignments`);
    } catch (error) {
      this.logger.warn(`Could not upgrade legacy roles: ${(error as Error).message}`);
    }
  }
}
