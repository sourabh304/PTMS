import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { ProjectsModule } from '../projects/projects.module';
import { MilestonesController } from './milestones.controller';
import { MilestonesService } from './milestones.service';

@Module({
  imports: [ProjectsModule, LookupsModule],
  controllers: [MilestonesController],
  providers: [MilestonesService],
})
export class MilestonesModule {}
