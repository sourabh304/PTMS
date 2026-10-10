import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { DomainEvent, NotificationRequestedEvent } from '../../common/events/domain-events';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class NotificationsListener {
  private readonly logger = new Logger(NotificationsListener.name);

  constructor(private readonly prisma: PrismaService) {}

  @OnEvent(DomainEvent.NOTIFICATION_REQUESTED, { async: true })
  async handle(event: NotificationRequestedEvent): Promise<void> {
    try {
      await this.prisma.notification.createMany({
        data: event.recipientIds.map((userId) => ({
          userId,
          organizationId: event.organizationId ?? null,
          type: event.type,
          title: event.title,
          body: event.body ?? null,
          link: event.link ?? null,
        })),
      });
    } catch (error) {
      this.logger.warn(`Could not create notifications: ${(error as Error).message}`);
    }
  }
}
