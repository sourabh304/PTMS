import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Max, MaxLength, Min, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { APPROVAL_STATUSES, ApprovalStatus } from '../../../common/constants/domain.constants';
import { NullableString, ToBoolean } from '../../../common/transformers/query.transformers';
import { OptionalDate, RequiredDate } from '../../../common/validation/date.decorators';
import { OptionalId } from '../../../common/validation/id.decorators';

/** Upper bound for a single entry: one full day. */
export const MAX_MINUTES_PER_ENTRY = 24 * 60;

export class TimeEntryQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() userId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taskId?: string;

  @ApiPropertyOptional({ enum: APPROVAL_STATUSES })
  @IsOptional()
  @IsIn(APPROVAL_STATUSES)
  approvalStatus?: ApprovalStatus;

  @ApiPropertyOptional({ description: 'Only the current user’s entries' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  mine?: boolean;

  @OptionalDate('From date (inclusive)')
  from?: Date;

  @OptionalDate('To date (inclusive)')
  to?: Date;
}

export class TimeSummaryQueryDto extends OmitType(TimeEntryQueryDto, ['page', 'limit', 'search', 'sortOrder'] as const) {}

export class CreateTimeEntryDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiPropertyOptional({ nullable: true }) @OptionalId() taskId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @OptionalId() issueId?: string | null;

  @ApiProperty({ type: String, format: 'date' })
  @RequiredDate()
  date: Date;

  @ApiProperty({ minimum: 1, maximum: MAX_MINUTES_PER_ENTRY })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_MINUTES_PER_ENTRY)
  minutes: number;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  notes?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isBillable?: boolean;
}

export class UpdateTimeEntryDto extends PartialType(OmitType(CreateTimeEntryDto, ['projectId'] as const)) {}

export class ReviewTimeEntryDto {
  @ApiProperty({ enum: [ApprovalStatus.APPROVED, ApprovalStatus.REJECTED] })
  @IsIn([ApprovalStatus.APPROVED, ApprovalStatus.REJECTED])
  status: ApprovalStatus;
}
