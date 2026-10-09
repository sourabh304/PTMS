import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString, IsUrl, MaxLength, MinLength, ValidateIf } from 'class-validator';
import { NullableString, TrimString } from '../../../common/transformers/query.transformers';
import { RequiredDate } from '../../../common/validation/date.decorators';
import { OptionalId } from '../../../common/validation/id.decorators';
import { MEETING_TYPES, MeetingType } from '../meeting.constants';

export class MeetingQueryDto {
  @ApiProperty({ type: String, format: 'date-time' })
  @RequiredDate()
  from: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @RequiredDate()
  to: Date;

  @ApiPropertyOptional({ description: "A project's meetings plus the organization-wide ones" })
  @IsOptional()
  @IsString()
  projectId?: string;
}

export class CreateMeetingDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(150)
  title: string;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @NullableString()
  @ValidateIf((_, value) => value !== null)
  @IsString()
  @MaxLength(2000)
  description?: string | null;

  @ApiProperty({ enum: MEETING_TYPES })
  @IsIn(MEETING_TYPES)
  type: MeetingType;

  @ApiProperty({ description: 'Link to join (Zoom, Teams, Meet…)' })
  @TrimString()
  @IsUrl({ protocols: ['http', 'https'], require_protocol: true })
  @MaxLength(2000)
  link: string;

  @ApiProperty({ type: String, format: 'date-time' })
  @RequiredDate()
  startsAt: Date;

  @ApiProperty({ type: String, format: 'date-time' })
  @RequiredDate()
  endsAt: Date;

  @ApiPropertyOptional({ nullable: true, description: 'Project whose members see it; null for the whole organization' })
  @OptionalId()
  projectId?: string | null;
}

export class UpdateMeetingDto extends PartialType(CreateMeetingDto) {}
