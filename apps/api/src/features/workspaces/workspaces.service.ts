import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrgRole } from '../../common/constants/roles.constants';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { OrganizationsService } from '../organizations/organizations.service';
import { PasswordService } from '../users/password.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { CreateWorkspaceDto } from './dto/workspace.dto';

const WORKSPACE_SELECT = {
  id: true,
  name: true,
  slug: true,
  createdAt: true,
  deletedAt: true,
  users: { where: { role: OrgRole.ADMIN }, select: USER_SUMMARY_SELECT, orderBy: { createdAt: 'asc' } },
  _count: { select: { users: true, projects: true } },
} satisfies Prisma.OrganizationSelect;

type WorkspaceRow = Prisma.OrganizationGetPayload<{ select: typeof WORKSPACE_SELECT }>;

/** Platform-level view of organizations, used only by the root administrator. */
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly passwords: PasswordService,
  ) {}

  async findAll() {
    const rows = await this.prisma.organization.findMany({ select: WORKSPACE_SELECT, orderBy: { createdAt: 'asc' } });
    return rows.map((row) => this.toSummary(row));
  }

  async create(dto: CreateWorkspaceDto) {
    const email = dto.adminEmail.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwords.hash(dto.adminPassword);
    const organization = await this.prisma.$transaction(async (tx) => {
      const created = await this.organizations.provision(tx, dto.name);
      await tx.user.create({
        data: {
          organizationId: created.id,
          email,
          firstName: dto.adminFirstName,
          lastName: dto.adminLastName,
          role: OrgRole.ADMIN,
          passwordHash,
        },
      });
      return created;
    });
    return this.findOne(organization.id);
  }

  /** Soft delete: the workspace's users are signed out and blocked; its data stays and can be restored. */
  async remove(actor: AuthenticatedUser, id: string) {
    if (id === actor.organizationId) {
      throw new BadRequestException('You cannot delete your own workspace');
    }
    const workspace = await this.findOne(id);
    if (workspace.deletedAt) return workspace;

    const now = new Date();
    await this.prisma.$transaction([
      this.prisma.organization.update({ where: { id }, data: { deletedAt: now } }),
      this.prisma.refreshToken.updateMany({ where: { user: { organizationId: id }, revokedAt: null }, data: { revokedAt: now } }),
    ]);
    return this.findOne(id);
  }

  async restore(id: string) {
    await this.findOne(id);
    await this.prisma.organization.update({ where: { id }, data: { deletedAt: null } });
    return this.findOne(id);
  }

  private async findOne(id: string) {
    const row = await this.prisma.organization.findUnique({ where: { id }, select: WORKSPACE_SELECT });
    if (!row) throw new NotFoundException('Workspace not found');
    return this.toSummary(row);
  }

  private toSummary({ users, _count, ...organization }: WorkspaceRow) {
    return { ...organization, admins: users, userCount: _count.users, projectCount: _count.projects };
  }
}
