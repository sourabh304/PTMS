import { Injectable, NotFoundException } from '@nestjs/common';
import { BillingInterval, SUBSCRIPTION_STATUSES } from '../../common/constants/domain.constants';
import { PlatformRole } from '../../common/constants/roles.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';

/** Number of newest organizations listed on the platform overview. */
const RECENT_ORGANIZATIONS = 5;
const MONTHS_PER_YEAR = 12;

@Injectable()
export class PlatformService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async assertOrganization(id: string): Promise<void> {
    if (!(await this.prisma.organization.count({ where: { id } }))) throw new NotFoundException('Organization not found');
  }

  /** Platform-wide health and revenue snapshot for the root console. */
  async overview() {
    const [activeOrgs, suspendedOrgs, users, projects, activePlans, byStatus, current, recentOrganizations] = await Promise.all([
      this.prisma.organization.count({ where: { isActive: true } }),
      this.prisma.organization.count({ where: { isActive: false } }),
      this.prisma.user.count({ where: { role: { not: PlatformRole.ROOT } } }),
      this.prisma.project.count(),
      this.prisma.plan.count({ where: { isActive: true } }),
      this.prisma.subscription.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.subscription.findMany({ where: this.subscriptions.currentWhere(), include: { plan: true } }),
      this.prisma.organization.findMany({
        orderBy: { createdAt: 'desc' },
        take: RECENT_ORGANIZATIONS,
        select: { id: true, name: true, slug: true, isActive: true, createdAt: true, _count: { select: { users: true } } },
      }),
    ]);

    // Monthly recurring revenue, normalized per currency (yearly plans count 1/12 per month).
    const mrr = new Map<string, number>();
    for (const { plan } of current) {
      const monthly = plan.billingInterval === BillingInterval.YEARLY ? plan.priceCents / MONTHS_PER_YEAR : plan.priceCents;
      mrr.set(plan.currency, (mrr.get(plan.currency) ?? 0) + monthly);
    }

    return {
      organizations: { total: activeOrgs + suspendedOrgs, active: activeOrgs, suspended: suspendedOrgs },
      users,
      projects,
      activePlans,
      currentSubscriptions: current.length,
      subscriptionsByStatus: SUBSCRIPTION_STATUSES.map((status) => ({
        status,
        count: byStatus.find((row) => row.status === status)?._count._all ?? 0,
      })),
      mrr: [...mrr.entries()].map(([currency, amountCents]) => ({ currency, amountCents: Math.round(amountCents) })),
      recentOrganizations,
    };
  }
}
