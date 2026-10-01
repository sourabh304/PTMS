import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';
import { OptionalDate } from '../../../common/validation/date.decorators';

export class ReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @OptionalDate('Start of the reporting window')
  from?: Date;

  @OptionalDate('End of the reporting window')
  to?: Date;
}
