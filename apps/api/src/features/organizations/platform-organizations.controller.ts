import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { PlatformOnly } from '../../common/decorators/account-scope.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import {
  CreatePlatformOrganizationDto,
  InitialCoordinatorDto,
  PlatformOrganizationQueryDto,
  UpdatePlatformOrganizationDto,
} from './dto/platform-organization.dto';
import { PlatformOrganizationsService } from './platform-organizations.service';

@ApiTags('Platform · Organizations')
@Controller('platform/organizations')
@PlatformOnly()
@RequirePermissions(Permission.PLATFORM_MANAGE)
export class PlatformOrganizationsController {
  constructor(private readonly organizations: PlatformOrganizationsService) {}

  @Get()
  findAll(@Query() query: PlatformOrganizationQueryDto) {
    return this.organizations.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.organizations.findOne(id);
  }

  @Post()
  create(@Body() dto: CreatePlatformOrganizationDto) {
    return this.organizations.create(dto);
  }

  @Post(':id/coordinators')
  addCoordinator(@Param('id') id: string, @Body() dto: InitialCoordinatorDto) {
    return this.organizations.addCoordinator(id, dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlatformOrganizationDto) {
    return this.organizations.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.organizations.remove(id);
  }
}
