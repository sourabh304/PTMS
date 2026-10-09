import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from '../../../common/transformers/query.transformers';
import { IsPassword } from '../../../common/validation/password.policy';

/** A new workspace (organization) together with its first owner account. */
export class CreateWorkspaceDto {
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
