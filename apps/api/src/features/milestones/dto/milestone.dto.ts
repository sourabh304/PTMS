import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { NullableString, ToBoolean, TrimString } from '../../../common/transformers/query.transformers';
import { OptionalDate, RequiredDate } from '../../../common/validation/date.decorators';
import { OptionalId } from '../../../common/validation/id.decorators';

export class MilestoneQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  projectId?: string;

  @ApiPropertyOptional({ description: 'Filter by completion' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  completed?: boolean;
}

export class CreateMilestoneDto {
  @ApiProperty()
  @IsString()
  projectId: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @OptionalDate()
  startDate?: Date | null;

  @ApiProperty({ type: String, format: 'date-time' })
  @RequiredDate()
  dueDate: Date;

  @ApiPropertyOptional({ nullable: true })
  @OptionalId()
  ownerId?: string | null;
}

export class UpdateMilestoneDto extends PartialType(OmitType(CreateMilestoneDto, ['projectId'] as const)) {
  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  completed?: boolean;
}
