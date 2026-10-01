import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from '../../../common/transformers/query.transformers';
import { IsPassword } from '../../../common/validation/password.policy';

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
}

export class RegisterDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  organizationName: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  firstName: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  lastName: string;

  @ApiProperty()
  @TrimString()
  @IsEmail()
  @MaxLength(254)
  email: string;

  @ApiProperty()
  @IsPassword()
  password: string;
}
