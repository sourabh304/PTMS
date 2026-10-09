import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsBoolean, IsIn, IsInt, IsOptional, IsString, Matches, MaxLength, Min, MinLength, ValidateIf } from 'class-validator';
import { BILLING_INTERVALS, BillingInterval } from '../../../common/constants/domain.constants';
import { NullableString, ToBoolean, TrimString } from '../../../common/transformers/query.transformers';

/** Optional positive limit; `null` means unlimited. */
const OptionalLimit = () =>
  applyDecorators(
    IsOptional(),
    ValidateIf((_, value) => value !== null),
    Type(() => Number),
    IsInt(),
    Min(1),
  );

export class PlanQueryDto {
  @ApiPropertyOptional({ description: 'Include deactivated plans' })
  @IsOptional()
  @ToBoolean()
  @IsBoolean()
  includeInactive?: boolean;
}

export class CreatePlanDto {
  @ApiProperty({ example: 'BUSINESS', description: 'Unique, upper-case identifier' })
  @TrimString()
  @Matches(/^[A-Z][A-Z0-9_]{1,31}$/, { message: 'code must be 2-32 upper-case letters, digits or underscores' })
  code: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  name: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(500)
  description?: string | null;

  @ApiProperty({ description: 'Price per billing interval in minor units (e.g. cents)' })
  @Type(() => Number)
  @IsInt()
  @Min(0)
  priceCents: number;

  @ApiPropertyOptional({ example: 'USD', description: 'Defaults to DEFAULT_CURRENCY' })
  @IsOptional()
  @Matches(/^[A-Z]{3}$/, { message: 'currency must be a 3-letter ISO code' })
  currency?: string;

  @ApiProperty({ enum: BILLING_INTERVALS })
  @IsIn(BILLING_INTERVALS)
  billingInterval: BillingInterval;

  @ApiPropertyOptional({ nullable: true, description: 'Maximum active users; null = unlimited' })
  @OptionalLimit()
  maxUsers?: number | null;

  @ApiPropertyOptional({ nullable: true, description: 'Maximum active projects; null = unlimited' })
  @OptionalLimit()
  maxProjects?: number | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

/** The code is the plan's stable identifier and cannot change. */
export class UpdatePlanDto extends PartialType(OmitType(CreatePlanDto, ['code'] as const)) {}
