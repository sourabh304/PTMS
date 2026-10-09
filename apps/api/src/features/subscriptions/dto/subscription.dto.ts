import { ApiProperty, ApiPropertyOptional, OmitType, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, MaxLength, ValidateIf } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { SUBSCRIPTION_STATUSES, SubscriptionStatus } from '../../../common/constants/domain.constants';
import { NullableString } from '../../../common/transformers/query.transformers';
import { OptionalDate } from '../../../common/validation/date.decorators';

export class SubscriptionQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() organizationId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() planId?: string;

  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUSES })
  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: SubscriptionStatus;
}

export class CreateSubscriptionDto {
  @ApiProperty()
  @IsString()
  organizationId: string;

  @ApiProperty()
  @IsString()
  planId: string;

  @ApiPropertyOptional({ enum: SUBSCRIPTION_STATUSES, default: SubscriptionStatus.ACTIVE })
  @IsOptional()
  @IsIn(SUBSCRIPTION_STATUSES)
  status?: SubscriptionStatus;

  @OptionalDate('Defaults to now')
  startDate?: Date;

  @OptionalDate('Leave empty for an open-ended subscription')
  endDate?: Date | null;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(1000)
  notes?: string | null;
}

/** The organization of a subscription is fixed; create a new subscription to move plans between organizations. */
export class UpdateSubscriptionDto extends PartialType(OmitType(CreateSubscriptionDto, ['organizationId'] as const)) {}
