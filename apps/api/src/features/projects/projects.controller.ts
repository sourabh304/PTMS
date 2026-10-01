import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import {
  AddMembersDto,
  CreateProjectDto,
  ProjectQueryDto,
  UpdateMemberDto,
  UpdateProjectDto,
} from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('Projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: ProjectQueryDto) {
    return this.projects.findAll(user, query);
  }

  @Post()
  @RequirePermissions(Permission.PROJECTS_CREATE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateProjectDto) {
    return this.projects.create(user, dto);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projects.findOne(user, id);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projects.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projects.remove(user, id);
  }

  @Get(':id/members')
  members(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.projects.members(user, id);
  }

  @Post(':id/members')
  addMembers(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: AddMembersDto) {
    return this.projects.addMembers(user, id, dto);
  }

  @Patch(':id/members/:userId')
  updateMember(
    @CurrentUser() user: AuthenticatedUser,
    @Param('id') id: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberDto,
  ) {
    return this.projects.updateMember(user, id, userId, dto.role);
  }

  @Delete(':id/members/:userId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeMember(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Param('userId') userId: string) {
    return this.projects.removeMember(user, id, userId);
  }
}
