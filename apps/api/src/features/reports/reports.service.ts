import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { LookupType, StatusCategory } from '../../common/constants/domain.constants';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { addDays, countWorkingDays, startOfDayUtc, startOfWeekUtc } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';
import { ProjectAccessService } from '../projects/project-access.service';
import { ProjectProgressService } from '../projects/project-progress.service';
import { USER_SUMMARY_SELECT } from '../users/users.select';
import { ReportQueryDto } from './dto/report-query.dto';
import { evaluateProjectHealth, PROJECT_HEALTH_RULES } from '../projects/project-health';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly progress: ProjectProgressService,
  ) {}

  private range(query: ReportQueryDto) {
    const to = query.to ?? new Date();
    const from = query.from ?? addDays(startOfDayUtc(to), -PROJECT_HEALTH_RULES.defaultRangeDays);
    return { from, to };
  }

  /** Resource utilization: open work and logged time vs capacity per person. */
  async workload(user: AuthenticatedUser, query: ReportQueryDto) {
    const { from, to } = this.range(query);
    if (query.projectId) await this.access.assertCanView(user, query.projectId);
    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    const projectFilter: Prisma.ProjectWhereInput = {
      ...this.access.visibleProjectsWhere(user),
      ...(query.projectId ? { id: query.projectId } : {}),
    };
    const openTask: Prisma.TaskWhereInput = {
      project: projectFilter,
      status: { category: { not: StatusCategory.CLOSED } },
    };

    const [users, assignments, logged] = await Promise.all([
      this.prisma.user.findMany({
        where: {
          organizationId: user.organizationId,
          isActive: true,
          ...(query.projectId ? { memberships: { some: { projectId: query.projectId } } } : {}),
        },
        select: { ...USER_SUMMARY_SELECT, jobTitle: true },
        orderBy: { firstName: 'asc' },
      }),
      this.prisma.taskAssignee.findMany({
        where: { task: openTask },
        select: { userId: true, task: { select: { dueDate: true, estimatedHours: true } } },
      }),
      this.prisma.timeEntry.groupBy({
        by: ['userId'],
        where: { project: projectFilter, date: { gte: from, lte: to } },
        _sum: { minutes: true },
      }),
    ]);

    const capacityMinutes = Math.round(countWorkingDays(from, to) * organization.workingHoursPerDay * 60);
    const now = new Date();

    return {
      from,
      to,
      capacityMinutes,
      rows: users.map((member) => {
        const own = assignments.filter((a) => a.userId === member.id);
        const loggedMinutes = logged.find((row) => row.userId === member.id)?._sum.minutes ?? 0;
        return {
          user: member,
          openTasks: own.length,
          overdueTasks: own.filter((a) => a.task.dueDate && a.task.dueDate < now).length,
          estimatedHours: own.reduce((sum, a) => sum + (a.task.estimatedHours ?? 0), 0),
          loggedMinutes,
          utilization: capacityMinutes ? Math.round((loggedMinutes / capacityMinutes) * 100) : 0,
        };
      }),
    };
  }

  /** Portfolio view: progress, schedule and budget health of every visible project. */
  async projects(user: AuthenticatedUser) {
    const projects = await this.prisma.project.findMany({
      where: { ...this.access.visibleProjectsWhere(user), isArchived: false },
      include: { status: true, owner: { select: USER_SUMMARY_SELECT } },
      orderBy: { name: 'asc' },
    });
    const ids = projects.map((p) => p.id);
    const [stats, logged, openIssues] = await Promise.all([
      this.progress.forProjects(user.organizationId, ids),
      this.prisma.timeEntry.groupBy({ by: ['projectId'], where: { projectId: { in: ids } }, _sum: { minutes: true } }),
      this.prisma.issue.groupBy({
        by: ['projectId'],
        where: { projectId: { in: ids }, status: { category: { not: StatusCategory.CLOSED } } },
        _count: { _all: true },
      }),
    ]);

    const now = new Date();
    return projects.map((project) => {
      const projectStats = stats.get(project.id)!;
      const loggedMinutes = logged.find((row) => row.projectId === project.id)?._sum.minutes ?? 0;
      return {
        id: project.id,
        name: project.name,
        key: project.key,
        color: project.color,
        status: project.status,
        owner: project.owner,
        startDate: project.startDate,
        endDate: project.endDate,
        budgetHours: project.budgetHours,
        loggedMinutes,
        openIssues: openIssues.find((row) => row.projectId === project.id)?._count._all ?? 0,
        stats: projectStats,
        health: evaluateProjectHealth(
          {
            statusCategory: project.status.category,
            openTasks: projectStats.openTasks,
            overdueTasks: projectStats.overdueTasks,
            endDate: project.endDate,
            budgetHours: project.budgetHours,
            loggedMinutes,
          },
          now,
        ),
      };
    });
  }

  /** Issue analytics: distribution plus weekly created vs. resolved trend. */
  async issues(user: AuthenticatedUser, query: ReportQueryDto) {
    const { from, to } = this.range(query);
    if (query.projectId) await this.access.assertCanView(user, query.projectId);
    const organization = await this.prisma.organization.findUniqueOrThrow({ where: { id: user.organizationId } });
    const scope: Prisma.IssueWhereInput = {
      project: { ...this.access.visibleProjectsWhere(user), ...(query.projectId ? { id: query.projectId } : {}) },
    };

    const [lookups, byStatus, bySeverity, byPriority, created, resolved] = await Promise.all([
      this.prisma.lookup.findMany({ where: { organizationId: user.organizationId }, orderBy: { position: 'asc' } }),
      this.prisma.issue.groupBy({ by: ['statusId'], where: scope, _count: { _all: true } }),
      this.prisma.issue.groupBy({ by: ['severityId'], where: scope, _count: { _all: true } }),
      this.prisma.issue.groupBy({ by: ['priorityId'], where: scope, _count: { _all: true } }),
      this.prisma.issue.findMany({ where: { ...scope, createdAt: { gte: from, lte: to } }, select: { createdAt: true } }),
      this.prisma.issue.findMany({ where: { ...scope, resolvedAt: { gte: from, lte: to } }, select: { resolvedAt: true } }),
    ]);

    const bucket = (type: LookupType, rows: { _count: { _all: number } }[], key: 'statusId' | 'severityId' | 'priorityId') =>
      lookups
        .filter((l) => l.type === type)
        .map((l) => ({
          id: l.id,
          name: l.name,
          color: l.color,
          count: (rows as (Record<typeof key, string> & { _count: { _all: number } })[]).find((r) => r[key] === l.id)?._count._all ?? 0,
        }));

    const weeks = new Map<string, { week: string; created: number; resolved: number }>();
    for (let cursor = startOfWeekUtc(from, organization.weekStartsOn); cursor <= to; cursor = addDays(cursor, 7)) {
      const week = cursor.toISOString().slice(0, 10);
      weeks.set(week, { week, created: 0, resolved: 0 });
    }
    const weekKey = (date: Date) => startOfWeekUtc(date, organization.weekStartsOn).toISOString().slice(0, 10);
    created.forEach(({ createdAt }) => weeks.get(weekKey(createdAt)) && weeks.get(weekKey(createdAt))!.created++);
    resolved.forEach(({ resolvedAt }) => resolvedAt && weeks.get(weekKey(resolvedAt)) && weeks.get(weekKey(resolvedAt))!.resolved++);

    return {
      from,
      to,
      byStatus: bucket(LookupType.ISSUE_STATUS, byStatus, 'statusId'),
      bySeverity: bucket(LookupType.ISSUE_SEVERITY, bySeverity, 'severityId'),
      byPriority: bucket(LookupType.PRIORITY, byPriority, 'priorityId'),
      trend: [...weeks.values()],
    };
  }
}
