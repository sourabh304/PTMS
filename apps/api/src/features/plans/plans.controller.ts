import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Permission } from '../../common/constants/permissions.constants';
import { PlatformOnly } from '../../common/decorators/account-scope.decorator';
import { RequirePermissions } from '../../common/decorators/require-permissions.decorator';
import { CreatePlanDto, PlanQueryDto, UpdatePlanDto } from './dto/plan.dto';
import { PlansService } from './plans.service';

@ApiTags('Platform · Plans')
@Controller('platform/plans')
@PlatformOnly()
@RequirePermissions(Permission.PLATFORM_MANAGE)
export class PlansController {
  constructor(private readonly plans: PlansService) {}

  @Get()
  findAll(@Query() query: PlanQueryDto) {
    return this.plans.findAll(query.includeInactive);
  }

  @Post()
  create(@Body() dto: CreatePlanDto) {
    return this.plans.create(dto);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePlanDto) {
    return this.plans.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.plans.remove(id);
  }
}
