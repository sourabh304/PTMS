import { Body, Controller, Delete, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RootAdminGuard } from '../../common/guards/root-admin.guard';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateWorkspaceDto } from './dto/workspace.dto';
import { WorkspacesService } from './workspaces.service';

@ApiTags('Workspaces')
@Controller('workspaces')
@UseGuards(RootAdminGuard)
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

  @Delete(':id')
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.workspaces.remove(user, id);
  }

  @Post(':id/restore')
  restore(@Param('id') id: string) {
    return this.workspaces.restore(id);
  }
}
