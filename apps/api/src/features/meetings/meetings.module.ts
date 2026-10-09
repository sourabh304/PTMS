import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { MeetingRemindersService } from './meeting-reminders.service';
import { MeetingsController } from './meetings.controller';
import { MeetingsService } from './meetings.service';

@Module({
  imports: [ProjectsModule],
  controllers: [MeetingsController],
  providers: [MeetingsService, MeetingRemindersService],
})
export class MeetingsModule {}
