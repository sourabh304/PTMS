import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { TimesheetsController } from './timesheets.controller';
import { TimesheetsService } from './timesheets.service';

@Module({
  imports: [ProjectsModule],
  controllers: [TimesheetsController],
  providers: [TimesheetsService],
})
export class TimesheetsModule {}
