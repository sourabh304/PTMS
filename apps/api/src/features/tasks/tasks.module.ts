import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { ProjectsModule } from '../projects/projects.module';
import { TasksController } from './tasks.controller';
import { TasksService } from './tasks.service';

@Module({
  imports: [ProjectsModule, LookupsModule],
  controllers: [TasksController],
  providers: [TasksService],
})
export class TasksModule {}
