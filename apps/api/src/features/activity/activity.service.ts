import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PaginationService } from '../../common/pagination/pagination.service';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { ActivityQueryDto } from './dto/activity-query.dto';

@Injectable()
export class ActivityService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly pagination: PaginationService,
  ) {}

  async findAll(user: AuthenticatedUser, query: ActivityQueryDto) {
    if (query.projectId) await this.access.assertCanView(user, query.projectId);
    const page = this.pagination.resolve(query.page, query.limit);
    const where: Prisma.ActivityWhereInput = {
      organizationId: user.organizationId,
      ...(query.projectId
        ? { projectId: query.projectId }
        : { OR: [{ projectId: null }, { project: this.access.visibleProjectsWhere(user) }] }),
      ...(query.entityType ? { entityType: query.entityType } : {}),
      ...(query.entityId ? { entityId: query.entityId } : {}),
      ...(query.actorId ? { actorId: query.actorId } : {}),
    };

    const [data, total] = await this.prisma.$transaction([
      this.prisma.activity.findMany({
        where,
        include: {
          actor: { select: USER_SUMMARY_SELECT },
          project: { select: { id: true, name: true, key: true, color: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.activity.count({ where }),
    ]);
    return this.pagination.build(data, total, page);
  }
}
