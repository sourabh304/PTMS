import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrgRole } from '../../common/constants/roles.constants';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import { PasswordService } from '../users/password.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import {
  CreatePlatformOrganizationDto,
  PlatformOrganizationQueryDto,
  UpdatePlatformOrganizationDto,
} from './dto/platform-organization.dto';
import { OrganizationsService } from './organizations.service';

/** Number of past subscriptions returned with an organization's details. */
const SUBSCRIPTION_HISTORY_SIZE = 10;

/** Root-only administration of every organization on the platform. */
@Injectable()
export class PlatformOrganizationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly subscriptions: SubscriptionsService,
    private readonly passwords: PasswordService,
    private readonly pagination: PaginationService,
  ) {}

  private include() {
    return {
      _count: { select: { users: true, projects: true } },
      subscriptions: {
        where: this.subscriptions.currentWhere(),
        include: { plan: true },
        orderBy: { startDate: 'desc' },
        take: 1,
      },
    } satisfies Prisma.OrganizationInclude;
  }

  async findAll(query: PlatformOrganizationQueryDto) {
    const page = this.pagination.resolve(query.page, query.limit);
    const where: Prisma.OrganizationWhereInput = {
      ...(query.status ? { isActive: query.status === 'active' } : {}),
      ...(query.search ? { OR: [{ name: { contains: query.search } }, { slug: { contains: query.search.toLowerCase() } }] } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        include: this.include(),
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.organization.count({ where }),
    ]);
    const data = rows.map(({ subscriptions, ...organization }) => ({ ...organization, currentSubscription: subscriptions[0] ?? null }));
    return this.pagination.build(data, total, page);
  }

  async findOne(id: string) {
    const organization = await this.prisma.organization.findUnique({
      where: { id },
      include: {
        _count: { select: { users: true, projects: true } },
        users: { where: { role: OrgRole.SUPER_ADMIN }, select: { ...USER_SUMMARY_SELECT, isActive: true, lastLoginAt: true } },
        subscriptions: { include: { plan: true }, orderBy: { startDate: 'desc' }, take: SUBSCRIPTION_HISTORY_SIZE },
      },
    });
    if (!organization) throw new NotFoundException('Organization not found');
    const [current, usage] = await Promise.all([this.subscriptions.findCurrent(id), this.subscriptions.usage(id)]);
    const { users: superAdmins, ...rest } = organization;
    return { ...rest, superAdmins, currentSubscription: current, usage };
  }

  /** Creates an organization together with its first Super Admin. */
  async create(dto: CreatePlatformOrganizationDto) {
    const email = dto.superAdmin.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with this email already exists');
    }
    const passwordHash = await this.passwords.hash(dto.superAdmin.password);
    const organization = await this.prisma.$transaction(async (tx) => {
      const created = await this.organizations.provision(tx, dto.name);
      await tx.user.create({
        data: {
          organizationId: created.id,
          email,
          passwordHash,
          firstName: dto.superAdmin.firstName,
          lastName: dto.superAdmin.lastName,
          role: OrgRole.SUPER_ADMIN,
        },
      });
      return created;
    });
    return this.findOne(organization.id);
  }

  async update(id: string, dto: UpdatePlatformOrganizationDto) {
    await this.assertExists(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.organization.update({ where: { id }, data: dto });
      if (dto.isActive === false) {
        // Suspension takes effect immediately: every session of the organization is revoked.
        await tx.refreshToken.updateMany({
          where: { revokedAt: null, user: { organizationId: id } },
          data: { revokedAt: new Date() },
        });
      }
    });
    return this.findOne(id);
  }

  /**
   * Permanently deletes an organization and all of its data. Projects go first because
   * project/issue/task rows restrict deletion of the users and lookups they reference.
   */
  async remove(id: string): Promise<void> {
    await this.assertExists(id);
    await this.prisma.$transaction([
      this.prisma.project.deleteMany({ where: { organizationId: id } }),
      this.prisma.organization.delete({ where: { id } }),
    ]);
  }

  private async assertExists(id: string): Promise<void> {
    if (!(await this.prisma.organization.count({ where: { id } }))) throw new NotFoundException('Organization not found');
  }
}
