import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { ProjectsModule } from '../projects/projects.module';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';

@Module({
  imports: [ProjectsModule, LookupsModule],
  controllers: [IssuesController],
  providers: [IssuesService],
})
export class IssuesModule {}
