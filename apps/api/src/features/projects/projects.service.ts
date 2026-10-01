import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActivityAction, EntityType, LookupType, NotificationType } from '../../common/constants/domain.constants';
import { ProjectRole } from '../../common/constants/roles.constants';
import { NotificationLinks } from '../../common/events/domain-events';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PaginationService } from '../../common/pagination/pagination.service';
import { fullName } from '../../common/utils/string.util';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { AddMembersDto, CreateProjectDto, ProjectQueryDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectAccessService } from './project-access.service';
import { ProjectProgressService } from './project-progress.service';

const PROJECT_INCLUDE = {
  status: true,
  owner: { select: USER_SUMMARY_SELECT },
  _count: { select: { members: true, milestones: true, issues: true } },
} satisfies Prisma.ProjectInclude;

@Injectable()
export class ProjectsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly progress: ProjectProgressService,
    private readonly lookups: LookupsService,
    private readonly pagination: PaginationService,
    private readonly events: EventPublisher,
  ) {}

  async findAll(user: AuthenticatedUser, query: ProjectQueryDto) {
    const page = this.pagination.resolve(query.page, query.limit);
    const where: Prisma.ProjectWhereInput = {
      ...this.access.visibleProjectsWhere(user),
      isArchived: query.archived ?? false,
      ...(query.statusId ? { statusId: query.statusId } : {}),
      ...(query.ownerId ? { ownerId: query.ownerId } : {}),
      ...(query.search
        ? { OR: [{ name: { contains: query.search } }, { key: { contains: query.search.toUpperCase() } }] }
        : {}),
    };

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: { [query.sortBy ?? 'updatedAt']: query.sortOrder ?? 'desc' },
        skip: page.skip,
        take: page.take,
      }),
      this.prisma.project.count({ where }),
    ]);

    const stats = await this.progress.forProjects(
      user.organizationId,
      projects.map((p) => p.id),
    );
    const data = projects.map((project) => ({ ...project, stats: stats.get(project.id)! }));
    return this.pagination.build(data, total, page);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const access = await this.access.assertCanView(user, id);
    const project = await this.prisma.project.findUniqueOrThrow({ where: { id }, include: PROJECT_INCLUDE });
    const stats = await this.progress.forProject(user.organizationId, id);
    return {
      ...project,
      stats,
      access: { role: access.memberRole, canEdit: access.canEdit, canManage: access.canManage },
    };
  }

  async create(user: AuthenticatedUser, dto: CreateProjectDto) {
    this.assertDateRange(dto.startDate, dto.endDate);
    const statusId = dto.statusId
      ? (await this.lookups.assertValid(user.organizationId, dto.statusId, LookupType.PROJECT_STATUS)).id
      : await this.lookups.getDefaultId(user.organizationId, LookupType.PROJECT_STATUS);
    const ownerId = dto.ownerId ?? user.id;
    await this.assertOrgUsers(user.organizationId, [ownerId, ...(dto.memberIds ?? [])]);

    const memberIds = (dto.memberIds ?? []).filter((id) => id !== ownerId && id !== user.id);
    const managerIds = [...new Set([ownerId, user.id])];

    const project = await this.prisma.project.create({
      data: {
        organizationId: user.organizationId,
        name: dto.name,
        key: dto.key,
        description: dto.description ?? null,
        color: dto.color ?? null,
        statusId,
        ownerId,
        startDate: dto.startDate ?? null,
        endDate: dto.endDate ?? null,
        budgetHours: dto.budgetHours ?? null,
        members: {
          create: [
            ...managerIds.map((userId) => ({ userId, role: ProjectRole.MANAGER })),
            ...memberIds.map((userId) => ({ userId, role: ProjectRole.MEMBER })),
          ],
        },
      },
      include: PROJECT_INCLUDE,
    });

    this.events.activity({
      organizationId: user.organizationId,
      projectId: project.id,
      actorId: user.id,
      entityType: EntityType.PROJECT,
      entityId: project.id,
      action: ActivityAction.CREATED,
      summary: `created project ${project.name}`,
    });
    this.events.notify({
      recipientIds: [...managerIds, ...memberIds],
      actorId: user.id,
      type: NotificationType.PROJECT_ADDED,
      title: `You were added to ${project.name}`,
      body: `${fullName(user)} added you to the project`,
      link: NotificationLinks.project(project.id),
    });
    return project;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateProjectDto) {
    const { project } = await this.access.assertCanManage(user, id);
    this.assertDateRange(
      dto.startDate === undefined ? project.startDate : dto.startDate,
      dto.endDate === undefined ? project.endDate : dto.endDate,
    );
    if (dto.statusId) await this.lookups.assertValid(user.organizationId, dto.statusId, LookupType.PROJECT_STATUS);
    if (dto.ownerId) await this.assertOrgUsers(user.organizationId, [dto.ownerId]);

    const updated = await this.prisma.$transaction(async (tx) => {
      if (dto.ownerId && dto.ownerId !== project.ownerId) {
        await tx.projectMember.upsert({
          where: { projectId_userId: { projectId: id, userId: dto.ownerId } },
          create: { projectId: id, userId: dto.ownerId, role: ProjectRole.MANAGER },
          update: { role: ProjectRole.MANAGER },
        });
      }
      return tx.project.update({ where: { id }, data: dto, include: PROJECT_INCLUDE });
    });

    const statusChanged = dto.statusId && dto.statusId !== project.statusId;
    this.events.activity({
      organizationId: user.organizationId,
      projectId: id,
      actorId: user.id,
      entityType: EntityType.PROJECT,
      entityId: id,
      action: statusChanged ? ActivityAction.STATUS_CHANGED : ActivityAction.UPDATED,
      summary: statusChanged
        ? `changed project status to ${updated.status.name}`
        : dto.isArchived !== undefined && dto.isArchived !== project.isArchived
          ? `${dto.isArchived ? 'archived' : 'restored'} project ${updated.name}`
          : `updated project ${updated.name}`,
    });
    return updated;
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    await this.access.assertCanManage(user, id);
    await this.prisma.project.delete({ where: { id } });
  }

  // ─── Members ─────────────────────────────────────────────────

  async members(user: AuthenticatedUser, projectId: string) {
    await this.access.assertCanView(user, projectId);
    return this.prisma.projectMember.findMany({
      where: { projectId },
      include: { user: { select: { ...USER_SUMMARY_SELECT, jobTitle: true, isActive: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addMembers(user: AuthenticatedUser, projectId: string, dto: AddMembersDto) {
    const { project } = await this.access.assertCanManage(user, projectId);
    await this.assertOrgUsers(user.organizationId, dto.userIds);

    const existing = await this.prisma.projectMember.findMany({
      where: { projectId, userId: { in: dto.userIds } },
      select: { userId: true },
    });
    const existingIds = new Set(existing.map((m) => m.userId));
    const newIds = dto.userIds.filter((id) => !existingIds.has(id));
    if (newIds.length) {
      await this.prisma.projectMember.createMany({
        data: newIds.map((userId) => ({ projectId, userId, role: dto.role })),
      });
      this.events.activity({
        organizationId: user.organizationId,
        projectId,
        actorId: user.id,
        entityType: EntityType.MEMBER,
        entityId: projectId,
        action: ActivityAction.JOINED,
        summary: `added ${newIds.length} member(s) to the project`,
      });
      this.events.notify({
        recipientIds: newIds,
        actorId: user.id,
        type: NotificationType.PROJECT_ADDED,
        title: `You were added to ${project.name}`,
        body: `${fullName(user)} added you to the project`,
        link: NotificationLinks.project(projectId),
      });
    }
    return this.members(user, projectId);
  }

  async updateMember(user: AuthenticatedUser, projectId: string, userId: string, role: ProjectRole) {
    const { project } = await this.access.assertCanManage(user, projectId);
    if (userId === project.ownerId && role !== ProjectRole.MANAGER) {
      throw new BadRequestException('The project owner must remain a manager');
    }
    await this.findMembership(projectId, userId);
    return this.prisma.projectMember.update({
      where: { projectId_userId: { projectId, userId } },
      data: { role },
    });
  }

  async removeMember(user: AuthenticatedUser, projectId: string, userId: string): Promise<void> {
    const { project } = await this.access.assertCanManage(user, projectId);
    if (userId === project.ownerId) {
      throw new BadRequestException('Transfer ownership before removing the project owner');
    }
    await this.findMembership(projectId, userId);
    await this.prisma.$transaction([
      this.prisma.taskAssignee.deleteMany({ where: { userId, task: { projectId } } }),
      this.prisma.projectMember.delete({ where: { projectId_userId: { projectId, userId } } }),
    ]);
    this.events.activity({
      organizationId: user.organizationId,
      projectId,
      actorId: user.id,
      entityType: EntityType.MEMBER,
      entityId: userId,
      action: ActivityAction.LEFT,
      summary: `removed a member from the project`,
    });
  }

  // ─── Private ─────────────────────────────────────────────────

  private async findMembership(projectId: string, userId: string) {
    const member = await this.prisma.projectMember.findUnique({ where: { projectId_userId: { projectId, userId } } });
    if (!member) throw new NotFoundException('Member not found');
    return member;
  }

  private async assertOrgUsers(organizationId: string, userIds: string[]): Promise<void> {
    const unique = [...new Set(userIds)];
    const count = await this.prisma.user.count({ where: { id: { in: unique }, organizationId, isActive: true } });
    if (count !== unique.length) throw new BadRequestException('One or more users are invalid or inactive');
  }

  private assertDateRange(start?: Date | null, end?: Date | null): void {
    if (start && end && end < start) {
      throw new BadRequestException('End date must be on or after the start date');
    }
  }
}
