import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';
import { EntityType } from '../../../common/constants/domain.constants';

export class ActivityQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() projectId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() entityId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() actorId?: string;

  @ApiPropertyOptional({ enum: Object.values(EntityType) })
  @IsOptional()
  @IsIn(Object.values(EntityType))
  entityType?: EntityType;
}
