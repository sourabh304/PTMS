import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { STATUS_CATEGORIES, StatusCategory } from '../../../common/constants/domain.constants';
import { NullableString, ToBoolean, TrimString } from '../../../common/transformers/query.transformers';
import { OptionalDate } from '../../../common/validation/date.decorators';
import { OptionalId } from '../../../common/validation/id.decorators';

export const ISSUE_SORT_FIELDS = ['createdAt', 'updatedAt', 'dueDate', 'number', 'title'] as const;
export type IssueSortField = (typeof ISSUE_SORT_FIELDS)[number];

export class IssueQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priorityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() severityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() reporterId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() milestoneId?: string;

  @ApiPropertyOptional({ enum: STATUS_CATEGORIES })
  @IsOptional()
  @IsIn(STATUS_CATEGORIES)
  statusCategory?: StatusCategory;

  @ApiPropertyOptional({ description: 'Only issues assigned to the current user' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ enum: ISSUE_SORT_FIELDS })
  @IsOptional()
  @IsIn(ISSUE_SORT_FIELDS)
  sortBy?: IssueSortField;
}

export class CreateIssueDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(250)
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(20000)
  description?: string | null;

  @ApiPropertyOptional() @IsOptional() @IsString() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priorityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() severityId?: string;
  @ApiPropertyOptional({ nullable: true }) @OptionalId() assigneeId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @OptionalId() milestoneId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @OptionalId() taskId?: string | null;

  @OptionalDate()
  dueDate?: Date | null;
}

export class UpdateIssueDto extends PartialType(OmitType(CreateIssueDto, ['projectId'] as const)) {}
