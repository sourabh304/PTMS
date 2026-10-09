import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrgRole } from '../../common/constants/roles.constants';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { Paginated, PaginationService } from '../../common/pagination/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
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
    if (target.isRootAdmin && !actor.isRootAdmin) {
      throw new ForbiddenException('Only a root administrator can change the root administrator account');
    }
    if (target.role === OrgRole.OWNER && actor.role !== OrgRole.OWNER) {
      throw new ForbiddenException('Only an owner can modify another owner');
    }
    if (dto.role) this.assertCanAssignRole(actor, dto.role);
    if (target.role === OrgRole.OWNER && (dto.role && dto.role !== OrgRole.OWNER || dto.isActive === false)) {
      await this.assertAnotherOwnerExists(actor.organizationId, target.id);
    }

    const user = await this.prisma.user.update({ where: { id }, data: dto, select: USER_PUBLIC_SELECT });
    if (dto.isActive === false) {
      await this.revokeSessions(id);
    }
    return user;
  }

  async resetPassword(actor: AuthenticatedUser, id: string, password: string): Promise<void> {
    const target = await this.findOne(actor.organizationId, id);
    if (target.isRootAdmin && !actor.isRootAdmin) {
      throw new ForbiddenException('Only a root administrator can change the root administrator account');
    }
    if (target.role === OrgRole.OWNER && actor.role !== OrgRole.OWNER) {
      throw new ForbiddenException('Only an owner can reset another owner’s password');
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
    if (role === OrgRole.OWNER && actor.role !== OrgRole.OWNER) {
      throw new ForbiddenException('Only an owner can grant the owner role');
    }
  }

  private async assertAnotherOwnerExists(organizationId: string, excludeId: string): Promise<void> {
    const owners = await this.prisma.user.count({
      where: { organizationId, role: OrgRole.OWNER, isActive: true, id: { not: excludeId } },
    });
    if (owners === 0) {
      throw new BadRequestException('The organization must keep at least one active owner');
    }
  }
}
