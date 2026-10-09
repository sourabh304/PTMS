import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { Automation } from '@prisma/client';
import { ActivityAction, EntityType, LookupType, NotificationType, StatusCategory } from '../../common/constants/domain.constants';
import { DomainEvent, NotificationLinks, TaskChangedEvent } from '../../common/events/domain-events';
import { EventPublisher } from '../../common/events/event-publisher.service';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { PrismaService } from '../../prisma/prisma.service';
import { LookupsService } from '../lookups/lookups.service';
import { ProjectAccessService } from '../projects/project-access.service';
import {
  ACTION_VALUE,
  AutomationAction,
  AutomationTrigger,
  AutomationValueKind,
  MAX_AUTOMATION_DEPTH,
  TRIGGER_VALUE,
} from './automation.constants';
import { CreateAutomationDto, UpdateAutomationDto } from './dto/automation.dto';

const TRIGGER_FOR_KIND: Record<TaskChangedEvent['kind'], AutomationTrigger> = {
  created: AutomationTrigger.ITEM_CREATED,
  status_changed: AutomationTrigger.STATUS_CHANGED,
  priority_changed: AutomationTrigger.PRIORITY_CHANGED,
  assigned: AutomationTrigger.ASSIGNEE_ADDED,
};

const AUTOMATION_INCLUDE = { createdBy: { select: { id: true, firstName: true, lastName: true } } } as const;
const DAY_MS = 86_400_000;

@Injectable()
export class AutomationsService {
  private readonly logger = new Logger(AutomationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly access: ProjectAccessService,
    private readonly lookups: LookupsService,
    private readonly events: EventPublisher,
  ) {}

  // ─── Management ──────────────────────────────────────────────

  async findAll(user: AuthenticatedUser, projectId: string) {
    await this.access.assertCanView(user, projectId);
    return this.prisma.automation.findMany({ where: { projectId }, orderBy: { createdAt: 'asc' }, include: AUTOMATION_INCLUDE });
  }

  async create(user: AuthenticatedUser, projectId: string, dto: CreateAutomationDto) {
    await this.access.assertCanManageWritable(user, projectId);
    const values = await this.validate(user, projectId, dto.trigger, dto.triggerValue ?? null, dto.action, dto.actionValue ?? null);
    return this.prisma.automation.create({
      data: { projectId, name: dto.name, trigger: dto.trigger, action: dto.action, ...values, isActive: dto.isActive ?? true, createdById: user.id },
      include: AUTOMATION_INCLUDE,
    });
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdateAutomationDto) {
    const existing = await this.findManageable(user, id);
    const trigger = (dto.trigger ?? existing.trigger) as AutomationTrigger;
    const action = (dto.action ?? existing.action) as AutomationAction;
    // Changing the trigger/action type resets a value that no longer fits it.
    const triggerValue = dto.triggerValue !== undefined ? dto.triggerValue : dto.trigger ? null : existing.triggerValue;
    const actionValue = dto.actionValue !== undefined ? dto.actionValue : dto.action ? null : existing.actionValue;
    const values = await this.validate(user, existing.projectId, trigger, triggerValue, action, actionValue);
    return this.prisma.automation.update({
      where: { id },
      data: { name: dto.name, trigger, action, ...values, isActive: dto.isActive },
      include: AUTOMATION_INCLUDE,
    });
  }

  async remove(user: AuthenticatedUser, id: string): Promise<void> {
    await this.findManageable(user, id);
    await this.prisma.automation.delete({ where: { id } });
  }

  private async findManageable(user: AuthenticatedUser, id: string): Promise<Automation> {
    const automation = await this.prisma.automation.findFirst({ where: { id, project: { organizationId: user.organizationId } } });
    if (!automation) throw new NotFoundException('Automation not found');
    await this.access.assertCanManageWritable(user, automation.projectId);
    return automation;
  }

  private async validate(
    user: AuthenticatedUser,
    projectId: string,
    trigger: AutomationTrigger,
    triggerValue: string | null,
    action: AutomationAction,
    actionValue: string | null,
  ) {
    const triggerKind = TRIGGER_VALUE[trigger];
    if (!triggerKind && triggerValue) throw new BadRequestException('This trigger does not take a value');
    if (triggerKind && triggerValue) await this.assertValue(user, projectId, triggerKind, triggerValue);

    const actionKind = ACTION_VALUE[action];
    if (actionKind && !actionValue) throw new BadRequestException('Choose a value for this action');
    if (!actionKind && actionValue) throw new BadRequestException('This action does not take a value');
    if (actionKind && actionValue) await this.assertValue(user, projectId, actionKind, actionValue);
    return { triggerValue, actionValue };
  }

  private async assertValue(user: AuthenticatedUser, projectId: string, kind: NonNullable<AutomationValueKind>, value: string): Promise<void> {
    switch (kind) {
      case 'status':
        await this.lookups.assertValid(user.organizationId, value, LookupType.TASK_STATUS);
        return;
      case 'priority':
        await this.lookups.assertValid(user.organizationId, value, LookupType.PRIORITY);
        return;
      case 'user':
        await this.access.assertMembers(projectId, [value]);
        return;
      case 'group':
        if (!(await this.prisma.taskList.count({ where: { id: value, projectId } }))) throw new BadRequestException('Group not found in this project');
        return;
      case 'days': {
        const days = Number(value);
        if (!Number.isInteger(days) || days < 0 || days > 365) throw new BadRequestException('Days must be a whole number from 0 to 365');
        return;
      }
    }
  }

  // ─── Execution ───────────────────────────────────────────────

  @OnEvent(DomainEvent.TASK_CHANGED, { async: true })
  async onTaskChanged(event: TaskChangedEvent): Promise<void> {
    const depth = event.depth ?? 0;
    if (depth >= MAX_AUTOMATION_DEPTH) return;
    try {
      const automations = await this.prisma.automation.findMany({
        where: { projectId: event.projectId, trigger: TRIGGER_FOR_KIND[event.kind], isActive: true },
        orderBy: { createdAt: 'asc' },
      });
      for (const automation of automations.filter((a) => this.matches(a, event))) {
        try {
          await this.run(automation, event, depth);
        } catch (error) {
          this.logger.warn(`Automation ${automation.id} failed: ${(error as Error).message}`);
        }
      }
    } catch (error) {
      this.logger.warn(`Could not evaluate automations: ${(error as Error).message}`);
    }
  }

  private matches(automation: Automation, event: TaskChangedEvent): boolean {
    if (!automation.triggerValue) return true;
    switch (automation.trigger) {
      case AutomationTrigger.STATUS_CHANGED:
        return automation.triggerValue === event.statusId;
      case AutomationTrigger.PRIORITY_CHANGED:
        return automation.triggerValue === event.priorityId;
      case AutomationTrigger.ASSIGNEE_ADDED:
        return !!event.assigneeIds?.includes(automation.triggerValue);
      default:
        return true;
    }
  }

  private async run(automation: Automation, event: TaskChangedEvent, depth: number): Promise<void> {
    const task = await this.prisma.task.findUnique({
      where: { id: event.taskId },
      include: { project: { select: { key: true } }, status: true, assignees: { select: { userId: true } } },
    });
    if (!task) return;

    const ref = `${task.project.key}-${task.number}`;
    const link = NotificationLinks.task(task.projectId, task.id);
    const next = { organizationId: event.organizationId, projectId: task.projectId, taskId: task.id, actorId: event.actorId, depth: depth + 1 };
    const value = automation.actionValue;
    let changed = false;

    switch (automation.action) {
      case AutomationAction.SET_STATUS: {
        if (!value || task.statusId === value) break;
        const status = await this.lookups.assertValid(event.organizationId, value, LookupType.TASK_STATUS);
        const closed = status.category === StatusCategory.CLOSED;
        await this.prisma.task.update({
          where: { id: task.id },
          data: closed ? { statusId: value, completedAt: new Date(), progress: 100 } : { statusId: value, completedAt: null },
        });
        this.record(automation, event, task, ActivityAction.STATUS_CHANGED, `moved ${ref} to ${status.name}`);
        this.notify(automation, [task.createdById, ...task.assignees.map((a) => a.userId)], `${ref} moved to ${status.name}`, task.title, link);
        this.events.taskChanged({ ...next, kind: 'status_changed', statusId: value });
        changed = true;
        break;
      }
      case AutomationAction.SET_PRIORITY: {
        if (!value || task.priorityId === value) break;
        const priority = await this.lookups.assertValid(event.organizationId, value, LookupType.PRIORITY);
        await this.prisma.task.update({ where: { id: task.id }, data: { priorityId: value } });
        this.record(automation, event, task, ActivityAction.UPDATED, `set the priority of ${ref} to ${priority.name}`);
        this.events.taskChanged({ ...next, kind: 'priority_changed', priorityId: value });
        changed = true;
        break;
      }
      case AutomationAction.ASSIGN_USER: {
        if (!value || task.assignees.some((a) => a.userId === value)) break;
        if (!(await this.prisma.projectMember.count({ where: { projectId: task.projectId, userId: value } }))) break;
        await this.prisma.taskAssignee.create({ data: { taskId: task.id, userId: value } });
        this.record(automation, event, task, ActivityAction.ASSIGNED, `assigned ${ref}`);
        this.notify(automation, [value], `${ref} assigned to you`, task.title, link);
        this.events.taskChanged({ ...next, kind: 'assigned', assigneeIds: [value] });
        changed = true;
        break;
      }
      case AutomationAction.MOVE_TO_GROUP: {
        if (!value || task.taskListId === value) break;
        const group = await this.prisma.taskList.findFirst({ where: { id: value, projectId: task.projectId } });
        if (!group) break;
        await this.prisma.task.update({ where: { id: task.id }, data: { taskListId: group.id } });
        this.record(automation, event, task, ActivityAction.UPDATED, `moved ${ref} to group ${group.name}`);
        changed = true;
        break;
      }
      case AutomationAction.SET_DUE_IN_DAYS: {
        const now = new Date();
        const due = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + Number(value ?? 0) * DAY_MS);
        const startDate = task.startDate && task.startDate > due ? due : undefined;
        await this.prisma.task.update({ where: { id: task.id }, data: { dueDate: due, ...(startDate ? { startDate } : {}) } });
        this.record(automation, event, task, ActivityAction.UPDATED, `set the due date of ${ref} to ${due.toISOString().slice(0, 10)}`);
        changed = true;
        break;
      }
      case AutomationAction.NOTIFY_USER:
        if (value) this.notify(automation, [value], `${ref}: ${automation.name}`, task.title, link);
        changed = !!value;
        break;
      case AutomationAction.NOTIFY_ASSIGNEES:
        this.notify(automation, task.assignees.map((a) => a.userId), `${ref}: ${automation.name}`, task.title, link);
        changed = task.assignees.length > 0;
        break;
      case AutomationAction.NOTIFY_CREATOR:
        this.notify(automation, [task.createdById], `${ref}: ${automation.name}`, task.title, link);
        changed = true;
        break;
    }

    if (changed) {
      await this.prisma.automation.update({ where: { id: automation.id }, data: { runCount: { increment: 1 }, lastRunAt: new Date() } });
    }
  }

  private record(automation: Automation, event: TaskChangedEvent, task: { id: string; projectId: string }, action: ActivityAction, summary: string): void {
    this.events.activity({
      organizationId: event.organizationId,
      projectId: task.projectId,
      actorId: event.actorId,
      entityType: EntityType.TASK,
      entityId: task.id,
      action,
      summary: `${summary} (automation “${automation.name}”)`,
      metadata: { automationId: automation.id },
    });
  }

  /** Automations notify everyone they target, including the person whose change triggered them. */
  private notify(automation: Automation, recipientIds: string[], title: string, taskTitle: string, link: string): void {
    this.events.notify({
      recipientIds,
      actorId: '',
      type: NotificationType.AUTOMATION,
      title,
      body: `Automation “${automation.name}” · ${taskTitle}`,
      link,
    });
  }
}
