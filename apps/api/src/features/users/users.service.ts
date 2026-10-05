import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { isSuperAdmin, OrgRole } from '../../common/constants/roles.constants';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Paginated, PaginationService } from '../../common/pagination/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import {
  ChangePasswordDto,
  CreateUserDto,
  UpdateProfileDto,
  UpdateUserDto,
  UserQueryDto,
} from './dto/user.dto';
import { PasswordService } from './password.service';
import { PublicUser, USER_PUBLIC_SELECT } from './users.select';

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly pagination: PaginationService,
    private readonly subscriptions: SubscriptionsService,
  ) {}

  async findAll(organizationId: string, query: UserQueryDto): Promise<Paginated<PublicUser>> {
    const page = this.pagination.resolve(query.page, query.limit);
    const where: Prisma.UserWhereInput = {
      organizationId,
      ...(query.role ? { role: query.role } : {}),
      ...(query.isActive !== undefined ? { isActive: query.isActive } : {}),
      ...(query.search
        ? {
            OR: [
              { firstName: { contains: query.search } },
              { lastName: { contains: query.search } },
              { email: { contains: query.search } },
              { jobTitle: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        select: USER_PUBLIC_SELECT,
        orderBy: [{ firstName: query.sortOrder ?? 'asc' }, { lastName: 'asc' }],
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.user.count({ where }),
    ]);
    return this.pagination.build(data, total, page);
  }

  async findOne(organizationId: string, id: string): Promise<PublicUser> {
    const user = await this.prisma.user.findFirst({ where: { id, organizationId }, select: USER_PUBLIC_SELECT });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(actor: AuthenticatedUser, dto: CreateUserDto): Promise<PublicUser> {
    this.assertCanAssignRole(actor, dto.role);
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('A user with this email already exists');
    }
    await this.subscriptions.assertCapacity(actor.organizationId, 'users');

    return this.prisma.user.create({
      data: {
        organizationId: actor.organizationId,
        email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        jobTitle: dto.jobTitle ?? null,
        hourlyRate: dto.hourlyRate ?? null,
        role: dto.role,
        passwordHash: await this.passwords.hash(dto.password),
      },
      select: USER_PUBLIC_SELECT,
    });
  }

  async update(actor: AuthenticatedUser, id: string, dto: UpdateUserDto): Promise<PublicUser> {
    const target = await this.findOne(actor.organizationId, id);

    if (target.id === actor.id && (dto.role !== undefined || dto.isActive === false)) {
      throw new BadRequestException('You cannot change your own role or deactivate yourself');
    }
    if (target.role === OrgRole.SUPER_ADMIN && !isSuperAdmin(actor.role)) {
      throw new ForbiddenException('Only a super admin can modify another super admin');
    }
    if (dto.role) this.assertCanAssignRole(actor, dto.role);
    if (target.role === OrgRole.SUPER_ADMIN && ((dto.role && dto.role !== OrgRole.SUPER_ADMIN) || dto.isActive === false)) {
      await this.assertAnotherSuperAdminExists(actor.organizationId, target.id);
    }
    if (dto.isActive === true && !target.isActive) {
      await this.subscriptions.assertCapacity(actor.organizationId, 'users');
    }

    const user = await this.prisma.user.update({ where: { id }, data: dto, select: USER_PUBLIC_SELECT });
    if (dto.isActive === false) {
      await this.revokeSessions(id);
    }
    return user;
  }

  async resetPassword(actor: AuthenticatedUser, id: string, password: string): Promise<void> {
    const target = await this.findOne(actor.organizationId, id);
    if (target.role === OrgRole.SUPER_ADMIN && !isSuperAdmin(actor.role)) {
      throw new ForbiddenException('Only a super admin can reset another super admin’s password');
    }
    await this.prisma.user.update({ where: { id }, data: { passwordHash: await this.passwords.hash(password) } });
    await this.revokeSessions(id);
  }

  updateProfile(userId: string, dto: UpdateProfileDto): Promise<PublicUser> {
    return this.prisma.user.update({ where: { id: userId }, data: dto, select: USER_PUBLIC_SELECT });
  }

  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (!(await this.passwords.verify(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }
    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException('New password must differ from the current one');
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await this.passwords.hash(dto.newPassword) },
    });
    await this.revokeSessions(userId);
  }

  private revokeSessions(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private assertCanAssignRole(actor: AuthenticatedUser, role: string): void {
    if (role === OrgRole.SUPER_ADMIN && !isSuperAdmin(actor.role)) {
      throw new ForbiddenException('Only a super admin can grant the super admin role');
    }
  }

  private async assertAnotherSuperAdminExists(organizationId: string, excludeId: string): Promise<void> {
    const superAdmins = await this.prisma.user.count({
      where: { organizationId, role: OrgRole.SUPER_ADMIN, isActive: true, id: { not: excludeId } },
    });
    if (superAdmins === 0) {
      throw new BadRequestException('The organization must keep at least one active super admin');
    }
  }
}
