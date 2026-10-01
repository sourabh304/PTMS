import { Module } from '@nestjs/common';
import { ProjectsModule } from '../projects/projects.module';
import { TaskListsController } from './task-lists.controller';
import { TaskListsService } from './task-lists.service';

@Module({
  imports: [ProjectsModule],
  controllers: [TaskListsController],
  providers: [TaskListsService],
})
export class TaskListsModule {}
