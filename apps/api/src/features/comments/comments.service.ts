import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { ActivityAction, EntityType, NotificationType } from '../../common/constants/domain.constants';
import { isCoordinator } from '../../common/constants/roles.constants';
import { NotificationLinks } from '../../common/events/domain-events';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { fullName } from '../../common/utils/string.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { CommentQueryDto, CreateCommentDto } from './dto/comment.dto';

interface CommentTarget {
  projectId: string;
  title: string;
  link: string;
  /** Users interested in new comments (creator/reporter + assignees); earlier commenters are added on create. */
  watcherIds: string[];
}

@Injectable()
export class CommentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly events: EventPublisher,
  ) {}

  async findAll(user: AuthenticatedUser, query: CommentQueryDto) {
    const target = await this.resolveTarget(user, query);
    await this.access.assertCanView(user, target.projectId);
    return this.prisma.comment.findMany({
      where: query.taskId ? { taskId: query.taskId } : { issueId: query.issueId },
      include: { author: { select: USER_SUMMARY_SELECT } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async create(user: AuthenticatedUser, dto: CreateCommentDto) {
    const target = await this.resolveTarget(user, dto);
    await this.assertWritable(user, target.projectId);

    const comment = await this.prisma.comment.create({
      data: { authorId: user.id, body: dto.body, taskId: dto.taskId ?? null, issueId: dto.issueId ?? null },
      include: { author: { select: USER_SUMMARY_SELECT } },
    });

    this.events.activity({
      organizationId: user.organizationId,
      projectId: target.projectId,
      actorId: user.id,
      entityType: dto.taskId ? EntityType.TASK : EntityType.ISSUE,
      entityId: (dto.taskId ?? dto.issueId)!,
      action: ActivityAction.COMMENTED,
      summary: `commented on ${target.title}`,
    });
    // Earlier commenters follow the conversation too.
    const participants = await this.prisma.comment.findMany({
      where: dto.taskId ? { taskId: dto.taskId } : { issueId: dto.issueId },
      distinct: ['authorId'],
      select: { authorId: true },
    });
    this.events.notify({
      organizationId: user.organizationId,
      recipientIds: [...target.watcherIds, ...participants.map((p) => p.authorId)],
      actorId: user.id,
      type: NotificationType.COMMENT_ADDED,
      title: `New comment on ${target.title}`,
      body: `${fullName(user)}: ${dto.body.slice(0, 140)}`,
      link: target.link,
    });
    return comment;
  }

  async update(user: AuthenticatedUser, id: string, body: string) {
    const comment = await this.findOwned(user, id);
    if (comment.authorId !== user.id) throw new ForbiddenException('You can only edit your own comments');
    return this.prisma.comment.update({
      where: { id },
      data: { body },
      include: { author: { select: USER_SUMMARY_SELECT } },
    });
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    const comment = await this.findOwned(user, id);
    if (comment.authorId !== user.id && !isCoordinator(user.role)) {
      throw new ForbiddenException('You can only delete your own comments');
    }
    await this.prisma.comment.delete({ where: { id } });
  }

  /**
   * A comment the user can see, scoped by the project it belongs to (not by its author, since the
   * root account writes comments without belonging to the organization). Archived projects are read-only.
   */
  private async findOwned(user: AuthenticatedUser, id: string) {
    const projectScope = { organizationId: user.organizationId };
    const comment = await this.prisma.comment.findFirst({
      where: { id, OR: [{ task: { project: projectScope } }, { issue: { project: projectScope } }] },
      include: { task: { select: { projectId: true } }, issue: { select: { projectId: true } } },
    });
    const projectId = comment?.task?.projectId ?? comment?.issue?.projectId;
    if (!comment || !projectId) throw new NotFoundException('Comment not found');
    await this.assertWritable(user, projectId, 'Comment not found');
    return comment;
  }

  private async assertWritable(user: AuthenticatedUser, projectId: string, notFound = 'Project not found'): Promise<void> {
    const { canView, project } = await this.access.resolve(user, projectId);
    if (!canView) throw new NotFoundException(notFound);
    if (project.isArchived) throw new BadRequestException('Archived projects are read-only');
  }

  private async resolveTarget(user: AuthenticatedUser, query: CommentQueryDto): Promise<CommentTarget> {
    if (!!query.taskId === !!query.issueId) {
      throw new BadRequestException('Provide exactly one of taskId or issueId');
    }
    const projectScope = { organizationId: user.organizationId };

    if (query.taskId) {
      const task = await this.prisma.task.findFirst({
        where: { id: query.taskId, project: projectScope },
        include: { project: { select: { key: true } }, assignees: { select: { userId: true } } },
      });
      if (!task) throw new NotFoundException('Task not found');
      return {
        projectId: task.projectId,
        title: `${task.project.key}-${task.number}`,
        link: NotificationLinks.task(task.projectId, task.id),
        watcherIds: [task.createdById, ...task.assignees.map((a) => a.userId)],
      };
    }

    const issue = await this.prisma.issue.findFirst({
      where: { id: query.issueId, project: projectScope },
      include: { project: { select: { key: true } } },
    });
    if (!issue) throw new NotFoundException('Issue not found');
    return {
      projectId: issue.projectId,
      title: `${issue.project.key}-BUG-${issue.number}`,
      link: NotificationLinks.issue(issue.projectId, issue.id),
      watcherIds: [issue.reporterId, ...(issue.assigneeId ? [issue.assigneeId] : [])],
    };
  }
}
