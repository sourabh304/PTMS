import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CustomFieldsService } from './custom-fields.service';
import { CreateCustomFieldDto, SetCustomValueDto, UpdateCustomFieldDto } from './dto/custom-field.dto';

@ApiTags('Custom columns')
@Controller()
export class CustomFieldsController {
  constructor(private readonly fields: CustomFieldsService) {}

  @Get('projects/:projectId/custom-fields')
  findAll(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.fields.findAll(user, projectId);
  }

  @Post('projects/:projectId/custom-fields')
  create(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string, @Body() dto: CreateCustomFieldDto) {
    return this.fields.create(user, projectId, dto);
  }

  @Patch('custom-fields/:id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateCustomFieldDto) {
    return this.fields.update(user, id, dto);
  }

  @Delete('custom-fields/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.fields.remove(user, id);
  }

  @Put('tasks/:taskId/custom-fields/:fieldId')
  setValue(@CurrentUser() user: AuthenticatedUser, @Param('taskId') taskId: string, @Param('fieldId') fieldId: string, @Body() dto: SetCustomValueDto) {
    return this.fields.setValue(user, taskId, fieldId, dto.value);
  }
}
