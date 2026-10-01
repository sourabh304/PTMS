import { Injectable } from '@nestjs/common';
import { LookupType, StatusCategory } from '../../common/constants/domain.constants';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';

export interface ProgressStats {
  totalTasks: number;
  completedTasks: number;
  openTasks: number;
  overdueTasks: number;
  progress: number;
}

/** Computes task based completion figures for one or many projects in a single pass. */
@Injectable()
export class ProjectProgressService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly lookups: LookupsService,
  ) {}

  async forProjects(organizationId: string, projectIds: string[]): Promise<Map<string, ProgressStats>> {
    const result = new Map<string, ProgressStats>(
      projectIds.map((id) => [id, { totalTasks: 0, completedTasks: 0, openTasks: 0, overdueTasks: 0, progress: 0 }]),
    );
    if (!projectIds.length) return result;

    const closedIds = await this.lookups.idsByCategory(organizationId, LookupType.TASK_STATUS, StatusCategory.CLOSED);
    const [byStatus, overdue] = await Promise.all([
      this.prisma.task.groupBy({
        by: ['projectId', 'statusId'],
        where: { projectId: { in: projectIds } },
        _count: { _all: true },
      }),
      this.prisma.task.groupBy({
        by: ['projectId'],
        where: { projectId: { in: projectIds }, statusId: { notIn: closedIds }, dueDate: { lt: new Date() } },
        _count: { _all: true },
      }),
    ]);

    for (const row of byStatus) {
      const stats = result.get(row.projectId)!;
      stats.totalTasks += row._count._all;
      if (closedIds.includes(row.statusId)) stats.completedTasks += row._count._all;
    }
    for (const row of overdue) {
      result.get(row.projectId)!.overdueTasks = row._count._all;
    }
    for (const stats of result.values()) {
      stats.openTasks = stats.totalTasks - stats.completedTasks;
      stats.progress = stats.totalTasks ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
    }
    return result;
  }

  async forProject(organizationId: string, projectId: string): Promise<ProgressStats> {
    return (await this.forProjects(organizationId, [projectId])).get(projectId)!;
  }
}
