import { ApiProperty, ApiPropertyOptional, PartialType, OmitType } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsBoolean,
  IsIn,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import {
  LOOKUP_TYPES,
  LookupType,
  STATUS_CATEGORIES,
  StatusCategory,
} from '../../../common/constants/domain.constants';
import { TrimString } from '../../../common/transformers/query.transformers';

export const HEX_COLOR = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

export class LookupQueryDto {
  @ApiPropertyOptional({ enum: LOOKUP_TYPES })
  @IsOptional()
  @IsIn(LOOKUP_TYPES)
  type?: LookupType;
}

export class CreateLookupDto {
  @ApiProperty({ enum: LOOKUP_TYPES })
  @IsIn(LOOKUP_TYPES)
  type: LookupType;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  name: string;

  @ApiProperty({ example: '#0ea5e9' })
  @Matches(HEX_COLOR, { message: 'color must be a hex color' })
  color: string;

  @ApiPropertyOptional({ enum: STATUS_CATEGORIES, description: 'Required for status types' })
  @IsOptional()
  @IsIn(STATUS_CATEGORIES)
  category?: StatusCategory;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}

export class UpdateLookupDto extends PartialType(OmitType(CreateLookupDto, ['type'] as const)) {}

export class ReorderLookupsDto {
  @ApiProperty({ enum: LOOKUP_TYPES })
  @IsIn(LOOKUP_TYPES)
  type: LookupType;

  @ApiProperty({ type: [String], description: 'Lookup ids in their new order' })
  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  ids: string[];
}

export class DeleteLookupQueryDto {
  @ApiPropertyOptional({ description: 'Lookup that replaces the deleted one wherever it is in use' })
  @IsOptional()
  @IsString()
  replacementId?: string;
}
