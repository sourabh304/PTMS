import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { ActivityAction, EntityType, LookupType, StatusCategory } from '../../common/constants/domain.constants';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { CreateMilestoneDto, MilestoneQueryDto, UpdateMilestoneDto } from './dto/milestone.dto';

const MILESTONE_INCLUDE = {
  owner: { select: USER_SUMMARY_SELECT },
  project: { select: { id: true, name: true, key: true, color: true } },
  _count: { select: { issues: true } },
} satisfies Prisma.MilestoneInclude;

@Injectable()
export class MilestonesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly lookups: LookupsService,
    private readonly events: EventPublisher,
  ) {}

  async findAll(user: AuthenticatedUser, query: MilestoneQueryDto) {
    if (query.projectId) await this.access.assertCanView(user, query.projectId);
    const milestones = await this.prisma.milestone.findMany({
      where: {
        project: { ...this.access.visibleProjectsWhere(user), isArchived: false },
        ...(query.projectId ? { projectId: query.projectId } : {}),
        ...(query.completed === undefined ? {} : { completedAt: query.completed ? { not: null } : null }),
      },
      include: MILESTONE_INCLUDE,
      orderBy: { dueDate: 'asc' },
    });
    return this.withProgress(user.organizationId, milestones);
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const milestone = await this.findVisible(user, id);
    const [withStats] = await this.withProgress(user.organizationId, [milestone]);
    return withStats;
  }

  async create(user: AuthenticatedUser, dto: CreateMilestoneDto) {
    await this.access.assertCanEdit(user, dto.projectId);
    this.assertDateRange(dto.startDate, dto.dueDate);
    if (dto.ownerId) await this.access.assertMembers(dto.projectId, [dto.ownerId]);

    const milestone = await this.prisma.milestone.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        description: dto.description ?? null,
        startDate: dto.startDate ?? null,
        dueDate: dto.dueDate,
        ownerId: dto.ownerId ?? null,
      },
      include: MILESTONE_INCLUDE,
    });
    this.recordActivity(user, milestone, ActivityAction.CREATED, `created milestone ${milestone.name}`);
    return milestone;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateMilestoneDto) {
    const existing = await this.findVisible(user, id);
    await this.access.assertCanEdit(user, existing.projectId);
    this.assertDateRange(
      dto.startDate === undefined ? existing.startDate : dto.startDate,
      dto.dueDate ?? existing.dueDate,
    );
    if (dto.ownerId) await this.access.assertMembers(existing.projectId, [dto.ownerId]);

    const { completed, ...rest } = dto;
    const data: Prisma.MilestoneUncheckedUpdateInput = { ...rest };
    if (completed !== undefined) data.completedAt = completed ? (existing.completedAt ?? new Date()) : null;

    const milestone = await this.prisma.milestone.update({ where: { id }, data, include: MILESTONE_INCLUDE });
    const justCompleted = completed && !existing.completedAt;
    this.recordActivity(
      user,
      milestone,
      justCompleted ? ActivityAction.COMPLETED : ActivityAction.UPDATED,
      justCompleted ? `completed milestone ${milestone.name}` : `updated milestone ${milestone.name}`,
    );
    return milestone;
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const milestone = await this.findVisible(user, id);
    await this.access.assertCanEdit(user, milestone.projectId);
    await this.prisma.milestone.delete({ where: { id } });
    this.recordActivity(user, milestone, ActivityAction.DELETED, `deleted milestone ${milestone.name}`);
  }

  private async withProgress<T extends { id: string }>(organizationId: string, milestones: T[]) {
    if (!milestones.length) return [];
    const closedIds = await this.lookups.idsByCategory(organizationId, LookupType.TASK_STATUS, StatusCategory.CLOSED);
    const rows = await this.prisma.task.groupBy({
      by: ['milestoneId', 'statusId'],
      where: { milestoneId: { in: milestones.map((m) => m.id) } },
      _count: { _all: true },
    });

    return milestones.map((milestone) => {
      const own = rows.filter((row) => row.milestoneId === milestone.id);
      const totalTasks = own.reduce((sum, row) => sum + row._count._all, 0);
      const completedTasks = own
        .filter((row) => closedIds.includes(row.statusId))
        .reduce((sum, row) => sum + row._count._all, 0);
      return {
        ...milestone,
        stats: {
          totalTasks,
          completedTasks,
          progress: totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0,
        },
      };
    });
  }

  private async findVisible(user: AuthenticatedUser, id: string) {
    const milestone = await this.prisma.milestone.findFirst({
      where: { id, project: this.access.visibleProjectsWhere(user) },
      include: MILESTONE_INCLUDE,
    });
    if (!milestone) throw new NotFoundException('Milestone not found');
    return milestone;
  }

  private assertDateRange(start?: Date | null, due?: Date | null): void {
    if (start && due && due < start) {
      throw new BadRequestException('Due date must be on or after the start date');
    }
  }

  private recordActivity(
    user: AuthenticatedUser,
    milestone: { id: string; projectId: string },
    action: ActivityAction,
    summary: string,
  ): void {
    this.events.activity({
      organizationId: user.organizationId,
      projectId: milestone.projectId,
      actorId: user.id,
      entityType: EntityType.MILESTONE,
      entityId: milestone.id,
      action,
      summary,
    });
  }
}
