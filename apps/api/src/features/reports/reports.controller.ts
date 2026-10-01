import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { AuthenticatedUser } from '../../common/interfaces/authenticated-user.interface';
import { ReportQueryDto } from './dto/report-query.dto';
import { ReportsService } from './reports.service';

@ApiTags('Reports')
@Controller('reports')
@RequirePermissions(Permission.REPORTS_VIEW)
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Get('workload')
  workload(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reports.workload(user, query);
  }

  @Get('projects')
  projects(@CurrentUser() user: AuthenticatedUser) {
    return this.reports.projects(user);
  }

  @Get('issues')
  issues(@CurrentUser() user: AuthenticatedUser, @Query() query: ReportQueryDto) {
    return this.reports.issues(user, query);
  }
}
