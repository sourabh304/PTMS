import { ConflictException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrgRole } from '../../common/constants/roles.constants';
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
  users: { where: { role: OrgRole.OWNER }, select: USER_SUMMARY_SELECT, orderBy: { createdAt: 'asc' } },
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
    const email = dto.ownerEmail.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await this.passwords.hash(dto.ownerPassword);
    const organization = await this.prisma.$transaction(async (tx) => {
      const created = await this.organizations.provision(tx, dto.name);
      await tx.user.create({
        data: {
          organizationId: created.id,
          email,
          firstName: dto.ownerFirstName,
          lastName: dto.ownerLastName,
          role: OrgRole.OWNER,
          passwordHash,
        },
      });
      return created;
    });

    const row = await this.prisma.organization.findUniqueOrThrow({ where: { id: organization.id }, select: WORKSPACE_SELECT });
    return this.toSummary(row);
  }

  private toSummary({ users, _count, ...organization }: WorkspaceRow) {
    return { ...organization, owners: users, userCount: _count.users, projectCount: _count.projects };
  }
}
