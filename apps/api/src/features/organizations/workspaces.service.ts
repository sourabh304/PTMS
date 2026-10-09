import { ConflictException, Injectable } from '@nestjs/common';
import { OrgRole } from '../../common/constants/roles.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { PasswordService } from '../users/password.service';
import { USER_PUBLIC_SELECT } from '../users/users.select';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { OrganizationsService } from './organizations.service';

/** Platform level workspace administration, reserved for root admins. */
@Injectable()
export class WorkspacesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly organizations: OrganizationsService,
    private readonly passwords: PasswordService,
  ) {}

  async findAll() {
    const workspaces = await this.prisma.organization.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        _count: { select: { users: true, projects: true } },
        users: { where: { role: OrgRole.OWNER }, select: { id: true, firstName: true, lastName: true, email: true }, orderBy: { createdAt: 'asc' }, take: 1 },
      },
    });
    return workspaces.map(({ users, _count, ...organization }) => ({
      ...organization,
      owner: users[0] ?? null,
      userCount: _count.users,
      projectCount: _count.projects,
    }));
  }

  async create(dto: CreateWorkspaceDto) {
    const email = dto.email.toLowerCase();
    if (await this.prisma.user.findUnique({ where: { email } })) {
      throw new ConflictException('An account with this email already exists');
    }
    const passwordHash = await this.passwords.hash(dto.password);
    return this.prisma.$transaction(async (tx) => {
      const organization = await this.organizations.provision(tx, dto.organizationName);
      const owner = await tx.user.create({
        data: { organizationId: organization.id, email, firstName: dto.firstName, lastName: dto.lastName, role: OrgRole.OWNER, passwordHash },
        select: USER_PUBLIC_SELECT,
      });
      return { organization, owner };
    });
  }
}
