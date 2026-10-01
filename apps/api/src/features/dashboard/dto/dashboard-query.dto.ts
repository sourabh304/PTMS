import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { DASHBOARD_DEFAULTS } from '../dashboard.constants';

export class DashboardQueryDto {
  @ApiPropertyOptional({ default: DASHBOARD_DEFAULTS.listSize })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(DASHBOARD_DEFAULTS.maxListSize)
  listSize?: number;
}
