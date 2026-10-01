import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { DashboardService } from './dashboard.service';
import { DashboardQueryDto } from './dto/dashboard-query.dto';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboard: DashboardService) {}

  @Get()
  overview(@CurrentUser() user: AuthenticatedUser, @Query() query: DashboardQueryDto) {
    return this.dashboard.overview(user, query.listSize);
  }

  @Get('projects/:projectId')
  project(@CurrentUser() user: AuthenticatedUser, @Param('projectId') projectId: string) {
    return this.dashboard.project(user, projectId);
  }
}
