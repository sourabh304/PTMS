import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { NullableString, TrimString } from '../../../common/transformers/query.transformers';
import { HEX_COLOR } from '../../lookups/dto/lookup.dto';

export class TaskListQueryDto {
  @ApiProperty()
  @IsString()
  projectId: string;
}

export class CreateTaskListDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  milestoneId?: string | null;

  @ApiPropertyOptional({ description: 'Defaults to the next color of the group palette' })
  @IsOptional()
  @Matches(HEX_COLOR)
  color?: string;
}

export class UpdateTaskListDto extends PartialType(OmitType(CreateTaskListDto, ['projectId'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}
