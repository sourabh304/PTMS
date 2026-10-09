import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { CURRENT_SUBSCRIPTION_STATUSES, NotificationType, SubscriptionStatus } from '../../common/constants/domain.constants';
import { ORG_ADMIN_ROLES } from '../../common/constants/roles.constants';
import { NotificationLinks } from '../../common/events/domain-events';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { PaginationService } from '../../common/pagination/pagination.service';
import { AppConfig } from '../../config/configuration';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSubscriptionDto, SubscriptionQueryDto, UpdateSubscriptionDto } from './dto/subscription.dto';

type Tx = Prisma.TransactionClient;

/** Resources limited by a plan. */
export type PlanResource = 'users' | 'projects';

const SUBSCRIPTION_INCLUDE = {
  plan: true,
  organization: { select: { id: true, name: true, slug: true, isActive: true } },
} satisfies Prisma.SubscriptionInclude;

const isCurrentStatus = (status: string) => CURRENT_SUBSCRIPTION_STATUSES.includes(status as SubscriptionStatus);

type SubscriptionWithPlan = Prisma.SubscriptionGetPayload<{ include: typeof SUBSCRIPTION_INCLUDE }>;

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pagination: PaginationService,
    private readonly config: ConfigService<AppConfig, true>,
    private readonly events: EventPublisher,
  ) {}

  /** Prisma filter for subscriptions that currently grant access. */
  currentWhere(now = new Date()): Prisma.SubscriptionWhereInput {
    return {
      status: { in: [...CURRENT_SUBSCRIPTION_STATUSES] },
      startDate: { lte: now },
      OR: [{ endDate: null }, { endDate: { gte: now } }],
    };
  }

  // ─── Platform (root) ─────────────────────────────────────────

  async findAll(query: SubscriptionQueryDto) {
    const page = this.pagination.resolve(query.page, query.limit);
    const where: Prisma.SubscriptionWhereInput = {
      ...(query.organizationId ? { organizationId: query.organizationId } : {}),
      ...(query.planId ? { planId: query.planId } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.search
        ? { OR: [{ organization: { name: { contains: query.search } } }, { plan: { name: { contains: query.search } } }] }
        : {}),
    };
    const [data, total] = await this.prisma.$transaction([
      this.prisma.subscription.findMany({
        where,
        include: SUBSCRIPTION_INCLUDE,
        orderBy: [{ startDate: query.sortOrder ?? 'desc' }, { createdAt: 'desc' }],
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.subscription.count({ where }),
    ]);
    return this.pagination.build(data, total, page);
  }

  async create(dto: CreateSubscriptionDto, actorId: string) {
    const organization = await this.prisma.organization.findUnique({ where: { id: dto.organizationId } });
    if (!organization) throw new BadRequestException('Organization not found');
    await this.assertAssignablePlan(dto.planId);

    const status = dto.status ?? SubscriptionStatus.ACTIVE;
    const startDate = dto.startDate ?? new Date();
    this.assertDateRange(startDate, dto.endDate);

    const subscription = await this.prisma.$transaction(async (tx) => {
      if (isCurrentStatus(status)) await this.closeCurrent(tx, dto.organizationId);
      return tx.subscription.create({
        data: {
          organizationId: dto.organizationId,
          planId: dto.planId,
          status,
          startDate,
          endDate: dto.endDate ?? null,
          notes: dto.notes ?? null,
        },
        include: SUBSCRIPTION_INCLUDE,
      });
    });
    await this.notifyAdmins(subscription, actorId, `Your organization is now on the ${subscription.plan.name} plan`);
    return subscription;
  }

  async update(id: string, dto: UpdateSubscriptionDto, actorId: string) {
    const existing = await this.prisma.subscription.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Subscription not found');
    if (dto.planId && dto.planId !== existing.planId) await this.assertAssignablePlan(dto.planId);
    this.assertDateRange(dto.startDate ?? existing.startDate, dto.endDate === undefined ? existing.endDate : dto.endDate);

    const becomesCurrent = dto.status !== undefined && isCurrentStatus(dto.status) && !isCurrentStatus(existing.status);
    // Reactivating an ended subscription reopens it unless a new end date is given.
    const reopen = becomesCurrent && dto.endDate === undefined && !!existing.endDate && existing.endDate < new Date();
    const subscription = await this.prisma.$transaction(async (tx) => {
      if (becomesCurrent) await this.closeCurrent(tx, existing.organizationId, id);
      return tx.subscription.update({
        where: { id },
        data: { ...dto, ...(reopen ? { endDate: null } : {}) },
        include: SUBSCRIPTION_INCLUDE,
      });
    });
    await this.notifyAdmins(subscription, actorId, `Your ${subscription.plan.name} subscription was updated`);
    return subscription;
  }

  /** Tells the organization's admins that their plan changed (they see it in Settings → Organization). */
  private async notifyAdmins(subscription: SubscriptionWithPlan, actorId: string, title: string): Promise<void> {
    const admins = await this.prisma.user.findMany({
      where: { organizationId: subscription.organizationId, isActive: true, role: { in: [...ORG_ADMIN_ROLES] } },
      select: { id: true },
    });
    const ends = subscription.endDate ? ` until ${subscription.endDate.toISOString().slice(0, 10)}` : '';
    this.events.notify({
      recipientIds: admins.map((admin) => admin.id),
      actorId,
      type: NotificationType.SUBSCRIPTION_CHANGED,
      title,
      body: `Status: ${subscription.status.toLowerCase().replace('_', ' ')}${ends}`,
      link: NotificationLinks.organizationSettings(),
    });
  }

  async remove(id: string): Promise<void> {
    const { count } = await this.prisma.subscription.deleteMany({ where: { id } });
    if (!count) throw new NotFoundException('Subscription not found');
  }

  // ─── Tenant ──────────────────────────────────────────────────

  findCurrent(organizationId: string) {
    return this.prisma.subscription.findFirst({
      where: { organizationId, ...this.currentWhere() },
      include: { plan: true },
      orderBy: { startDate: 'desc' },
    });
  }

  async usage(organizationId: string): Promise<Record<PlanResource, number>> {
    const [users, projects] = await Promise.all([
      this.prisma.user.count({ where: { organizationId, isActive: true } }),
      this.prisma.project.count({ where: { organizationId, isArchived: false } }),
    ]);
    return { users, projects };
  }

  /** Current plan and consumption, shown to organization admins. */
  async overview(organizationId: string) {
    const [subscription, usage] = await Promise.all([this.findCurrent(organizationId), this.usage(organizationId)]);
    return { subscription, usage, requireActiveSubscription: this.config.get('billing', { infer: true }).requireActiveSubscription };
  }

  /**
   * Throws when adding one more `resource` would exceed the organization's plan.
   * Without a current subscription, creation is allowed unless REQUIRE_ACTIVE_SUBSCRIPTION is on.
   */
  async assertCapacity(organizationId: string, resource: PlanResource): Promise<void> {
    const subscription = await this.findCurrent(organizationId);
    if (!subscription) {
      if (this.config.get('billing', { infer: true }).requireActiveSubscription) {
        throw new ForbiddenException('Your organization has no active subscription. Contact the platform administrator.');
      }
      return;
    }
    const limit = resource === 'users' ? subscription.plan.maxUsers : subscription.plan.maxProjects;
    if (limit === null) return;
    const used = (await this.usage(organizationId))[resource];
    if (used >= limit) {
      throw new ForbiddenException(
        `Your ${subscription.plan.name} plan allows up to ${limit} active ${resource}. Contact the platform administrator to upgrade.`,
      );
    }
  }

  // ─── Private ─────────────────────────────────────────────────

  private async assertAssignablePlan(planId: string): Promise<void> {
    const plan = await this.prisma.plan.findUnique({ where: { id: planId } });
    if (!plan) throw new BadRequestException('Plan not found');
    if (!plan.isActive) throw new BadRequestException('This plan is deactivated and cannot be assigned');
  }

  private assertDateRange(start: Date, end?: Date | null): void {
    if (end && end < start) throw new BadRequestException('End date must be on or after the start date');
  }

  /** Ends any other current subscription so an organization never has two at once. */
  private async closeCurrent(tx: Tx, organizationId: string, exceptId?: string): Promise<void> {
    const now = new Date();
    await tx.subscription.updateMany({
      where: { organizationId, status: { in: [...CURRENT_SUBSCRIPTION_STATUSES] }, ...(exceptId ? { id: { not: exceptId } } : {}) },
      data: { status: SubscriptionStatus.CANCELED, endDate: now },
    });
  }
}
