import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, Project } from '@prisma/client';
import { hasPermission, Permission } from '../../common/constants/permissions.constants';
import { isProjectManager } from '../../common/constants/roles.constants';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';

export interface ProjectAccess {
  project: Project;
  isMember: boolean;
  canView: boolean;
  canEdit: boolean;
  canManage: boolean;
}

/** Central authority for project-scoped authorization, reused by every project child feature. */
@Injectable()
export class ProjectAccessService {
  constructor(private readonly prisma: PrismaService) {}

  /** Prisma filter selecting only the projects the user may see. */
  visibleProjectsWhere(user: AuthenticatedUser): Prisma.ProjectWhereInput {
    return {
      organizationId: user.organizationId,
      ...(hasPermission(user.role, Permission.PROJECTS_VIEW_ALL) ? {} : { members: { some: { userId: user.id } } }),
    };
  }

  async resolve(user: AuthenticatedUser, projectId: string): Promise<ProjectAccess> {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId: user.organizationId },
    });
    if (!project) throw new NotFoundException('Project not found');

    const membership = await this.prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId, userId: user.id } },
    });
    const isMember = !!membership;
    // Project managers run every project; the owner runs their own; members work in it.
    const canManage = isProjectManager(user.role) || project.ownerId === user.id;
    const canEdit = canManage || isMember;
    const canView = canEdit || hasPermission(user.role, Permission.PROJECTS_VIEW_ALL);

    return { project, isMember, canView, canEdit, canManage };
  }

  async assertCanView(user: AuthenticatedUser, projectId: string): Promise<ProjectAccess> {
    const access = await this.resolve(user, projectId);
    if (!access.canView) throw new NotFoundException('Project not found');
    return access;
  }

  async assertCanEdit(user: AuthenticatedUser, projectId: string): Promise<ProjectAccess> {
    const access = await this.assertCanView(user, projectId);
    if (!access.canEdit) throw new ForbiddenException('You have read-only access to this project');
    if (access.project.isArchived) throw new BadRequestException('Archived projects are read-only');
    return access;
  }

  async assertCanManage(user: AuthenticatedUser, projectId: string): Promise<ProjectAccess> {
    const access = await this.assertCanView(user, projectId);
    if (!access.canManage) throw new ForbiddenException('Only project managers and the project owner can do this');
    return access;
  }

  /** Ensures the given users are members of the project (used for assignment). */
  async assertMembers(projectId: string, userIds: string[]): Promise<void> {
    const unique = [...new Set(userIds)];
    if (!unique.length) return;
    const count = await this.prisma.projectMember.count({ where: { projectId, userId: { in: unique } } });
    if (count !== unique.length) {
      throw new BadRequestException('Assignees must be members of the project');
    }
  }
}
