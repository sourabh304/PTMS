import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsEmail, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from '../../../common/transformers/query.transformers';

export class LoginDto {
  @ApiProperty()
  @TrimString()
  @IsEmail()
  email: string;

  @ApiProperty()
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  password: string;

  @ApiPropertyOptional({ description: 'Keep me signed in (longer, persistent session)' })
  @IsOptional()
  @IsBoolean()
  remember?: boolean;
}
