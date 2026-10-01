import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from '../../../common/transformers/query.transformers';

export class CommentQueryDto {
  @ApiPropertyOptional() @IsOptional() @IsString() taskId?: string;
  @ApiPropertyOptional() @IsOptional() @IsString() issueId?: string;
}

export class CreateCommentDto extends CommentQueryDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body: string;
}

export class UpdateCommentDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(10000)
  body: string;
}
