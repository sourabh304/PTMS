import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';
import { TrimString } from '../../../common/transformers/query.transformers';
import { IsPassword } from '../../../common/validation/password.policy';

/** A new workspace together with its first owner. */
export class CreateWorkspaceDto {
  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  name: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  ownerFirstName: string;

  @ApiProperty()
  @TrimString()
  @IsString()
  @MinLength(1)
  @MaxLength(60)
  ownerLastName: string;

  @ApiProperty()
  @TrimString()
  @IsEmail()
  @MaxLength(254)
  ownerEmail: string;

  @ApiProperty()
  @IsPassword()
  ownerPassword: string;
}
