import { applyDecorators } from '@nestjs/common';
import { IsOptional, IsString, ValidateIf } from 'class-validator';
import { NullableString } from '../transformers/query.transformers';

/** Optional reference id; send `null` to clear the relation. */
export const OptionalId = () =>
  applyDecorators(
    IsOptional(),
    NullableString(),
    ValidateIf((_, value) => value !== null),
    IsString(),
  );
