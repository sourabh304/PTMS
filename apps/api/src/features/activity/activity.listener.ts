import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { ActivityRecordedEvent, DomainEvent } from '../../common/events/domain-events';
import { PrismaService } from '../../prisma/prisma.service';

/** Persists the audit / activity stream asynchronously so it never slows down requests. */
@Injectable()
export class ActivityListener {
  private readonly logger = new Logger(ActivityListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(DomainEvent.ACTIVITY_RECORDED, { async: true })
  async handle(event: ActivityRecordedEvent): Promise<void> {
    try {
      await this.prisma.activity.create({
        data: {
          organizationId: event.organizationId,
          projectId: event.projectId ?? null,
          actorId: event.actorId,
          entityType: event.entityType,
          entityId: event.entityId,
          action: event.action,
          summary: event.summary,
          metadata: event.metadata ? JSON.stringify(event.metadata) : null,
        },
      });
    } catch (error) {
      // The project may have been deleted in the same request; activity is best-effort.
      this.logger.warn(`Could not record activity: ${(error as Error).message}`);
    }
  }
}
