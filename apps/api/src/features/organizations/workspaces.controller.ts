import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@Controller('workspaces')
@RequirePermissions(Permission.WORKSPACES_MANAGE)
export class WorkspacesController {
  constructor(private readonly workspaces: WorkspacesService) {}

  @Get()
  findAll() {
    return this.workspaces.findAll();
  }

  @Post()
  create(@Body() dto: CreateWorkspaceDto) {
    return this.workspaces.create(dto);
  }
}
