import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { CreateMeetingDto, MeetingQueryDto, UpdateMeetingDto } from './dto/meeting.dto';
import { MeetingsService } from './meetings.service';

@ApiTags('Meetings')
@Controller('meetings')
export class MeetingsController {
  constructor(private readonly meetings: MeetingsService) {}

  @Get()
  findAll(@CurrentUser() user: AuthenticatedUser, @Query() query: MeetingQueryDto) {
    return this.meetings.findAll(user, query);
  }

  @Get(':id')
  findOne(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.meetings.findOne(user, id);
  }

  @Post()
  @RequirePermissions(Permission.MEETINGS_MANAGE)
  create(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateMeetingDto) {
    return this.meetings.create(user, dto);
  }

  @Patch(':id')
  @RequirePermissions(Permission.MEETINGS_MANAGE)
  update(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string, @Body() dto: UpdateMeetingDto) {
    return this.meetings.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @RequirePermissions(Permission.MEETINGS_MANAGE)
  remove(@CurrentUser() user: AuthenticatedUser, @Param('id') id: string) {
    return this.meetings.remove(user, id);
  }
}
