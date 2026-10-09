import { Injectable, Logger, OnApplicationBootstrap, OnModuleDestroy } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { NotificationType, StatusCategory } from '../../common/constants/domain.constants';
import { NotificationLinks } from '../../common/events/domain-events';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { addDays, todayInTimezone } from '../../common/utils/date.util';
import { PrismaService } from '../../prisma/prisma.service';

/** Each reminder is sent once per due date, so checking often only catches new work sooner. */
const CHECK_INTERVAL_MS = 60 * 60 * 1000;
const FIRST_CHECK_DELAY_MS = 15_000;
/** Reminders come from the system, never from a person, so no recipient is filtered out as the actor. */
const SYSTEM_ACTOR = 'system';

const OPEN_STATUS: Prisma.LookupWhereInput = { OR: [{ category: null }, { category: { not: StatusCategory.CLOSED } }] };

interface DueItem {
  ref: string;
  title: string;
  projectName: string;
  dueDate: Date;
  dueSoonNotifiedFor: Date | null;
  overdueNotifiedFor: Date | null;
  recipientIds: string[];
  link: string;
}

/** Reminds assignees when their tasks and issues are due today or tomorrow, and when they become overdue. */
@Injectable()
export class DueRemindersService implements OnApplicationBootstrap, OnModuleDestroy {
  private readonly logger = new Logger(DueRemindersService.name);
  private readonly timers: NodeJS.Timeout[] = [];
  private running = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly events: EventPublisher,
  ) {}

  onApplicationBootstrap(): void {
    this.timers.push(setTimeout(() => void this.run(), FIRST_CHECK_DELAY_MS).unref());
    this.timers.push(setInterval(() => void this.run(), CHECK_INTERVAL_MS).unref());
  }

  onModuleDestroy(): void {
    this.timers.forEach((timer) => clearTimeout(timer));
  }

  /** Sends every reminder that is due and not sent yet. Safe to call repeatedly. */
  async run(now = new Date()): Promise<void> {
    if (this.running) return;
    this.running = true;
    try {
      const organizations = await this.prisma.organization.findMany({ where: { isActive: true }, select: { id: true, timezone: true } });
      for (const organization of organizations) {
        const today = todayInTimezone(organization.timezone, now);
        await this.remindTasks(organization.id, today);
        await this.remindIssues(organization.id, today);
      }
    } catch (error) {
      this.logger.warn(`Could not send due date reminders: ${(error as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  private async remindTasks(organizationId: string, today: Date): Promise<void> {
    const tasks = await this.prisma.task.findMany({
      where: {
        project: { organizationId, isArchived: false },
        status: OPEN_STATUS,
        dueDate: { lte: addDays(today, 1) },
        assignees: { some: { user: { isActive: true } } },
      },
      select: {
        id: true,
        number: true,
        title: true,
        projectId: true,
        dueDate: true,
        dueSoonNotifiedFor: true,
        overdueNotifiedFor: true,
        project: { select: { key: true, name: true } },
        assignees: { where: { user: { isActive: true } }, select: { userId: true } },
      },
    });
    for (const task of tasks) {
      const kind = this.send(
        {
          ref: `${task.project.key}-${task.number}`,
          title: task.title,
          projectName: task.project.name,
          dueDate: task.dueDate!,
          dueSoonNotifiedFor: task.dueSoonNotifiedFor,
          overdueNotifiedFor: task.overdueNotifiedFor,
          recipientIds: task.assignees.map((assignee) => assignee.userId),
          link: NotificationLinks.task(task.projectId, task.id),
        },
        today,
      );
      if (kind) await this.prisma.task.update({ where: { id: task.id }, data: { [kind]: task.dueDate } });
    }
  }

  private async remindIssues(organizationId: string, today: Date): Promise<void> {
    const issues = await this.prisma.issue.findMany({
      where: {
        project: { organizationId, isArchived: false },
        status: OPEN_STATUS,
        dueDate: { lte: addDays(today, 1) },
        assignee: { isActive: true },
      },
      select: {
        id: true,
        number: true,
        title: true,
        projectId: true,
        assigneeId: true,
        dueDate: true,
        dueSoonNotifiedFor: true,
        overdueNotifiedFor: true,
        project: { select: { key: true, name: true } },
      },
    });
    for (const issue of issues) {
      const kind = this.send(
        {
          ref: `${issue.project.key}-BUG-${issue.number}`,
          title: issue.title,
          projectName: issue.project.name,
          dueDate: issue.dueDate!,
          dueSoonNotifiedFor: issue.dueSoonNotifiedFor,
          overdueNotifiedFor: issue.overdueNotifiedFor,
          recipientIds: [issue.assigneeId!],
          link: NotificationLinks.issue(issue.projectId, issue.id),
        },
        today,
      );
      if (kind) await this.prisma.issue.update({ where: { id: issue.id }, data: { [kind]: issue.dueDate } });
    }
  }

  /** Notifies the item's assignees if this reminder was not sent for its current due date; returns the field to mark. */
  private send(item: DueItem, today: Date): 'dueSoonNotifiedFor' | 'overdueNotifiedFor' | null {
    const overdue = item.dueDate < today;
    const sentFor = overdue ? item.overdueNotifiedFor : item.dueSoonNotifiedFor;
    if (sentFor?.getTime() === item.dueDate.getTime()) return null;

    const when = overdue ? 'is overdue' : item.dueDate.getTime() === today.getTime() ? 'is due today' : 'is due tomorrow';
    const dueLabel = new Intl.DateTimeFormat('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' }).format(item.dueDate);
    this.events.notify({
      recipientIds: item.recipientIds,
      actorId: SYSTEM_ACTOR,
      type: overdue ? NotificationType.OVERDUE : NotificationType.DUE_SOON,
      title: `${item.ref} ${when}`,
      body: `${item.title} · ${item.projectName} · due ${dueLabel}`,
      link: item.link,
    });
    return overdue ? 'overdueNotifiedFor' : 'dueSoonNotifiedFor';
  }
}
