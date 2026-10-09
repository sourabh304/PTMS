import { Injectable, NotFoundException } from '@nestjs/common';
import { OrgRole, PlatformRole } from '../../common/constants/roles.constants';
import { PrismaService } from '../../prisma/prisma.service';

/** Number of newest organizations listed on the platform overview. */
const RECENT_ORGANIZATIONS = 5;

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async assertOrganization(id: string): Promise<void> {
    if (!(await this.prisma.organization.count({ where: { id } }))) throw new NotFoundException('Organization not found');
  }

  /** Platform-wide snapshot for the root console. */
  async overview() {
    const [activeOrgs, suspendedOrgs, users, coordinators, projects, recentOrganizations] = await Promise.all([
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.organization.count({ where: { isActive: false } }),
      this.prisma.user.count({ where: { role: { not: PlatformRole.ROOT } } }),
      this.prisma.user.count({ where: { role: OrgRole.PROJECT_COORDINATOR } }),
      this.prisma.project.count(),
      this.prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_ORGANIZATIONS,
        select: { id: true, name: true, slug: true, isActive: true, createdAt: true, _count: { select: { users: true } } },
      }),
    ]);

    return {
      organizations: { total: activeOrgs + suspendedOrgs, active: activeOrgs, suspended: suspendedOrgs },
      users,
      coordinators,
      projects,
      recentOrganizations,
    };
  }
}
