import { Module } from '@nestjs/common';
import { MeetingsModule } from '../meetings/meetings.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { CronController } from './cron.controller';

@Module({
  imports: [NotificationsModule, MeetingsModule],
  controllers: [CronController],
})
export class CronModule {}
