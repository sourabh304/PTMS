import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { AutomationsService } from './automations.service';
import { CreateAutomationDto, UpdateAutomationDto } from './dto/automation.dto';

@ApiTags('Automations')
@Controller()
export class AutomationsController {
  constructor(private readonly automations: AutomationsService) {}

  @Get('projects/:projectId/automations')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.automations.findAll(user, projectId);
  }

  @Post('projects/:projectId/automations')
  create(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string, @Body() dto: CreateAutomationDto) {
    return this.automations.create(user, projectId, dto);
  }

  @Patch('automations/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateAutomationDto) {
    return this.automations.update(user, id, dto);
  }

  @Delete('automations/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.automations.remove(user, id);
  }
}
