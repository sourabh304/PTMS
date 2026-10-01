import { Global, Injectable, Module } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityRecordedEvent, DomainEvent, NotificationRequestedEvent } from './domain-events';

/** Thin, typed facade over the event bus so features never depend on each other directly. */
@Injectable()
export class EventPublisher {
  constructor(private readonly emitter: EventEmitter2) {}

  activity(event: ActivityRecordedEvent): void {
    this.emitter.emit(DomainEvent.ACTIVITY_RECORDED, event);
  }

  notify(event: NotificationRequestedEvent): void {
    const recipientIds = [...new Set(event.recipientIds)].filter((id) => id && id !== event.actorId);
    if (recipientIds.length) {
      this.emitter.emit(DomainEvent.NOTIFICATION_REQUESTED, { ...event, recipientIds });
    }
  }
}

@Global()
@Module({
  providers: [EventPublisher],
  exports: [EventPublisher],
})
export class EventsModule {}
