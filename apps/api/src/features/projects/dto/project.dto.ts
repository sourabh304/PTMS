import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { STATUS_CATEGORIES, StatusCategory } from '../../../common/constants/domain.constants';
import { NullableString, ToBoolean, TrimString } from '../../../common/transformers/query.transformers';
import { OptionalDate } from '../../../common/validation/date.decorators';
import { HEX_COLOR } from '../../lookups/dto/lookup.dto';

export const PROJECT_SORT_FIELDS = ['name', 'createdAt', 'updatedAt', 'endDate', 'key'] as const;
export type ProjectSortField = (typeof PROJECT_SORT_FIELDS)[number];

export class ProjectQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  statusId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  ownerId?: string;

  @ApiPropertyOptional({ enum: STATUS_CATEGORIES, description: 'Filter by the semantic category of the project status' })
  @IsOptional()
  @IsIn(STATUS_CATEGORIES)
  statusCategory?: StatusCategory;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  archived?: boolean;

  @ApiPropertyOptional({ enum: PROJECT_SORT_FIELDS })
  @IsOptional()
  @IsIn(PROJECT_SORT_FIELDS)
  sortBy?: ProjectSortField;
}

export class CreateProjectDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty({ example: 'WEB', description: '2-10 upper-case letters/digits, unique per organization' })
  @TrimString()
  @Matches(/^[A-Z][A-Z0-9]{1,9}$/, { message: 'key must be 2-10 upper-case letters or digits, starting with a letter' })
  key: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @Matches(HEX_COLOR)
  color?: string | null;

  @ApiPropertyOptional({ description: 'Defaults to the organization default project status' })
  @IsOptional()
  @IsString()
  statusId?: string;

  @ApiPropertyOptional({ description: 'Defaults to the creator' })
  @IsOptional()
  @IsString()
  ownerId?: string;

  @OptionalDate()
  startDate?: Date | null;

  @OptionalDate()
  endDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  budgetHours?: number | null;

  @ApiPropertyOptional({ type: [String], description: 'Initial members (added with the MEMBER role)' })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  memberIds?: string[];
}

export class UpdateProjectDto extends PartialType(OmitType(CreateProjectDto, ['memberIds'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isArchived?: boolean;
}

export class AddMembersDto {
  @ApiProperty({ type: [String] })
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  userIds: string[];
}
