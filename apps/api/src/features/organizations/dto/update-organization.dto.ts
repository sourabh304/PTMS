import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsNumber, IsOptional, IsString, IsUrl, Matches, Max, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { NullableString, TrimString } from '../../../common/transformers/query.transformers';
import { HEX_COLOR } from '../../lookups/dto/lookup.dto';

export class UpdateOrganizationDto {
  @ApiPropertyOptional()
  @IsOptional()
  @TrimString()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name?: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsUrl({ require_tld: false })
  logoUrl?: string | null;

  @ApiPropertyOptional({ nullable: true, example: '#2563eb' })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @Matches(HEX_COLOR)
  primaryColor?: string | null;

  @ApiPropertyOptional({ example: 'Asia/Kolkata' })
  @IsOptional()
  @IsString()
  @MaxLength(64)
  timezone?: string;

  @ApiPropertyOptional({ minimum: 0, maximum: 6 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(6)
  weekStartsOn?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: 24 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(24)
  workingHoursPerDay?: number;
}
