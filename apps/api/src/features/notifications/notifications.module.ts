import { Module } from '@nestjs/common';
import { DueRemindersService } from './due-reminders.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsListener } from './notifications.listener';
import { NotificationsService } from './notifications.service';

@Module({
  controllers: [NotificationsController],
  providers: [NotificationsService, NotificationsListener, DueRemindersService],
  exports: [DueRemindersService],
})
export class NotificationsModule {}
