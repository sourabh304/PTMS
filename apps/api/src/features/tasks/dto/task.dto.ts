import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayUnique,
  IsArray,
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import {
  DEPENDENCY_TYPES,
  DependencyType,
  STATUS_CATEGORIES,
  StatusCategory,
} from '../../../common/constants/domain.constants';
import { NullableString, ToBoolean, TrimString } from '../../../common/transformers/query.transformers';
import { OptionalDate } from '../../../common/validation/date.decorators';
import { OptionalId } from '../../../common/validation/id.decorators';

export const TASK_SORT_FIELDS = ['position', 'dueDate', 'startDate', 'createdAt', 'updatedAt', 'title', 'number'] as const;
export type TaskSortField = (typeof TASK_SORT_FIELDS)[number];


export class TaskQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() statusId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() priorityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() milestoneId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() taskListId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() assigneeId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() parentId?: string;

  @ApiPropertyOptional({ enum: STATUS_CATEGORIES })
  @IsOptional()
  @IsIn(STATUS_CATEGORIES)
  statusCategory?: StatusCategory;

  @ApiPropertyOptional({ description: 'Only tasks assigned to the current user' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  mine?: boolean;

  @ApiPropertyOptional({ description: 'Only top level tasks (no subtasks)' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  rootOnly?: boolean;

  @ApiPropertyOptional({ description: 'Only open tasks past their due date' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  overdue?: boolean;

  @OptionalDate('Due on or after')
  dueFrom?: Date;

  @OptionalDate('Due on or before')
  dueTo?: Date;

  @ApiPropertyOptional({ enum: TASK_SORT_FIELDS })
  @IsOptional()
  @IsIn(TASK_SORT_FIELDS)
  sortBy?: TaskSortField;
}

export class CreateTaskDto {
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
  @ApiPropertyOptional({ nullable: true }) @OptionalId() taskListId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @OptionalId() milestoneId?: string | null;
  @ApiPropertyOptional({ nullable: true }) @OptionalId() parentId?: string | null;

  @OptionalDate()
  startDate?: Date | null;

  @OptionalDate()
  dueDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @ValidateIf((_, value) => value !== null)
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @Max(10000)
  estimatedHours?: number | null;

  @ApiPropertyOptional({ minimum: 0, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  progress?: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayUnique()
  @IsString({ each: true })
  assigneeIds?: string[];
}

export class UpdateTaskDto extends PartialType(OmitType(CreateTaskDto, ['projectId'] as const)) {}

export class MoveTaskDto {
  @ApiProperty()
  @IsString()
  statusId: string;

  @ApiProperty({ description: 'Sort key inside the status column' })
  @Type(() => Number)
  @IsNumber()
  position: number;
}

export class AddDependencyDto {
  @ApiProperty({ description: 'Task that must happen before this one' })
  @IsString()
  predecessorId: string;

  @ApiPropertyOptional({ enum: DEPENDENCY_TYPES })
  @IsOptional()
  @IsIn(DEPENDENCY_TYPES)
  type?: DependencyType;
}

export class GanttQueryDto {
  @ApiProperty()
  @IsString()
  projectId: string;
}
