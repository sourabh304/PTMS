import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { ProjectsModule } from '../projects/projects.module';
import { AutomationsController } from './automations.controller';
import { AutomationsService } from './automations.service';

@Module({
  imports: [ProjectsModule, LookupsModule],
  controllers: [AutomationsController],
  providers: [AutomationsService],
})
export class AutomationsModule {}
