import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsIn, IsOptional, IsString, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { NullableString, TrimString } from '../../../common/transformers/query.transformers';
import { AutomationAction, AutomationTrigger } from '../automation.constants';

export class CreateAutomationDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  name: string;

  @ApiProperty({ enum: Object.values(AutomationTrigger) })
  @IsIn(Object.values(AutomationTrigger))
  trigger: AutomationTrigger;

  @ApiPropertyOptional({ nullable: true, description: 'Status, priority or user id; null matches any' })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  triggerValue?: string | null;

  @ApiProperty({ enum: Object.values(AutomationAction) })
  @IsIn(Object.values(AutomationAction))
  action: AutomationAction;

  @ApiPropertyOptional({ nullable: true, description: 'Status/priority/user/group id, or a number of days' })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  actionValue?: string | null;

  @ApiPropertyOptional()
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class UpdateAutomationDto extends PartialType(CreateAutomationDto) {}
