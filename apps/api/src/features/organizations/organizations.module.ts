import { Module } from '@nestjs/common';
import { LookupsModule } from '../lookups/lookups.module';
import { UsersModule } from '../users/users.module';
import { OrganizationsController } from './organizations.controller';
import { OrganizationsService } from './organizations.service';
import { PlatformOrganizationsController } from './platform-organizations.controller';
import { PlatformOrganizationsService } from './platform-organizations.service';

@Module({
  imports: [LookupsModule, UsersModule],
  controllers: [OrganizationsController, PlatformOrganizationsController],
  providers: [OrganizationsService, PlatformOrganizationsService],
  exports: [OrganizationsService],
})
export class OrganizationsModule {}
