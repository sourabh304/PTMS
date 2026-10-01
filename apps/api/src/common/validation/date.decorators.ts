import { applyDecorators } from '@nestjs/common';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsDate, IsOptional, ValidateIf } from 'class-validator';

const toDate = ({ value }: { value: unknown }) => {
  if (value === null) return null;
  if (value === undefined || value === '') return undefined;
  const date = new Date(value as string);
  return Number.isNaN(date.getTime()) ? value : date;
};

/** Optional ISO date. Send `null` to clear the value. */
export const OptionalDate = (description?: string) =>
  applyDecorators(
    ApiPropertyOptional({ type: String, format: 'date-time', nullable: true, description }),
    IsOptional(),
    Transform(toDate),
    ValidateIf((_, value) => value !== null),
    IsDate(),
  );

/** Required ISO date. */
export const RequiredDate = () => applyDecorators(Transform(toDate), IsDate());
