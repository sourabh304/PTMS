import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { ProjectAccessService } from './project-access.service';
import { ProjectProgressService } from './project-progress.service';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [LookupsModule],
  controllers: [ProjectsController],
  providers: [ProjectsService, ProjectAccessService, ProjectProgressService],
  exports: [ProjectAccessService, ProjectProgressService],
})
export class ProjectsModule {}
