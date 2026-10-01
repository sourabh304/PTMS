import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateTaskListDto, TaskListQueryDto, UpdateTaskListDto } from './dto/task-list.dto';
import { TaskListsService } from './task-lists.service';

@ApiTags('Task lists')
@Controller('task-lists')
export class TaskListsController {
  constructor(private readonly taskLists: TaskListsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: TaskListQueryDto) {
    return this.taskLists.findAll(user, query.projectId);
  }

  @Post()
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateTaskListDto) {
    return this.taskLists.create(user, dto);
  }

  @Patch(':id')
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateTaskListDto) {
    return this.taskLists.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.taskLists.remove(user, id);
  }
}
