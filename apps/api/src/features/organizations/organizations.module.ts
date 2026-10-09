import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';

@Module({
  imports: [LookupsModule, UsersModule],
  controllers: [OrganizationsController, WorkspacesController],
  providers: [OrganizationsService, WorkspacesService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
