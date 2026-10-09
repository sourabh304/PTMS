import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { Allow, ArrayMaxSize, IsArray, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength, ValidateNested } from 'class-validator';
import { TrimString } from '../../../common/transformers/query.transformers';
import { HEX_COLOR } from '../../lookups/dto/lookup.dto';
import { CustomFieldType, MAX_DROPDOWN_OPTIONS } from '../custom-field.constants';

export class CustomFieldOptionDto {
  @ApiPropertyOptional({ description: 'Keep the id of an existing option so values stay attached' })
  @IsOptional()
  @IsString()
  @MaxLength(40)
  id?: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  label: string;

  @ApiProperty({ example: '#00c875' })
  @Matches(HEX_COLOR)
  color: string;
}

export class CreateCustomFieldDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name: string;

  @ApiProperty({ enum: Object.values(CustomFieldType) })
  @IsIn(Object.values(CustomFieldType))
  type: CustomFieldType;

  @ApiPropertyOptional({ type: [CustomFieldOptionDto], description: 'Dropdown choices' })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_DROPDOWN_OPTIONS)
  @ValidateNested({ each: true })
  @Type(() => CustomFieldOptionDto)
  options?: CustomFieldOptionDto[];
}

export class UpdateCustomFieldDto {
  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  name?: string;

  @ApiPropertyOptional({ type: [CustomFieldOptionDto] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(MAX_DROPDOWN_OPTIONS)
  @ValidateNested({ each: true })
  @Type(() => CustomFieldOptionDto)
  options?: CustomFieldOptionDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  position?: number;
}

export class SetCustomValueDto {
  @ApiProperty({ nullable: true, description: 'Type-specific value; null clears it' })
  @Allow()
  value: unknown;
}
