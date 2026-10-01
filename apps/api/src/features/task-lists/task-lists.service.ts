import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityAction, EntityType } from '../../common/constants/domain.constants';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { CreateTaskListDto, UpdateTaskListDto } from './dto/task-list.dto';

const TASK_LIST_INCLUDE = {
  milestone: { select: { id: true, name: true } },
  _count: { select: { tasks: true } },
} as const;

@Injectable()
export class TaskListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly events: EventPublisher,
  ) {}

  async findAll(user: AuthenticatedUser, projectId: string) {
    await this.access.assertCanView(user, projectId);
    return this.prisma.taskList.findMany({
      where: { projectId },
      include: TASK_LIST_INCLUDE,
      orderBy: [{ position: 'asc' }, { createdAt: 'asc' }],
    });
  }

  async create(user: AuthenticatedUser, dto: CreateTaskListDto) {
    await this.access.assertCanEdit(user, dto.projectId);
    if (dto.milestoneId) await this.assertMilestone(dto.projectId, dto.milestoneId);
    const last = await this.prisma.taskList.findFirst({
      where: { projectId: dto.projectId },
      orderBy: { position: 'desc' },
    });
    const list = await this.prisma.taskList.create({
      data: {
        projectId: dto.projectId,
        name: dto.name,
        milestoneId: dto.milestoneId ?? null,
        position: (last?.position ?? -1) + 1,
      },
      include: TASK_LIST_INCLUDE,
    });
    this.events.activity({
      organizationId: user.organizationId,
      projectId: dto.projectId,
      actorId: user.id,
      entityType: EntityType.TASK_LIST,
      entityId: list.id,
      action: ActivityAction.CREATED,
      summary: `created task list ${list.name}`,
    });
    return list;
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateTaskListDto) {
    const list = await this.findOwned(user, id);
    await this.access.assertCanEdit(user, list.projectId);
    if (dto.milestoneId) await this.assertMilestone(list.projectId, dto.milestoneId);
    return this.prisma.taskList.update({ where: { id }, data: dto, include: TASK_LIST_INCLUDE });
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const list = await this.findOwned(user, id);
    await this.access.assertCanEdit(user, list.projectId);
    await this.prisma.taskList.delete({ where: { id } });
  }

  private async findOwned(user: AuthenticatedUser, id: string) {
    const list = await this.prisma.taskList.findFirst({
      where: { id, project: { organizationId: user.organizationId } },
    });
    if (!list) throw new NotFoundException('Task list not found');
    return list;
  }

  private async assertMilestone(projectId: string, milestoneId: string): Promise<void> {
    const exists = await this.prisma.milestone.count({ where: { id: milestoneId, projectId } });
    if (!exists) throw new BadRequestException('Milestone does not belong to this project');
  }
}
