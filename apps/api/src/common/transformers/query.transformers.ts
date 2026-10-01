import { Transform } from 'class-transformer';

/** Parses query-string booleans ("true"/"false"/"1"/"0") correctly. */
export const ToBoolean = () =>
  Transform(({ obj, key }) => {
    const raw: unknown = obj[key];
    if (raw === undefined || raw === null || raw === '') return undefined;
    if (typeof raw === 'boolean') return raw;
    return ['true', '1', 'yes'].includes(String(raw).toLowerCase());
  });

/** Trims incoming strings and converts empty strings to undefined. */
export const TrimString = () =>
  Transform(({ value }) => {
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  });

/** Allows `null` to be sent explicitly to clear an optional field, trims strings. */
export const NullableString = () =>
  Transform(({ value }) => {
    if (value === null) return null;
    if (typeof value !== 'string') return value;
    const trimmed = value.trim();
    return trimmed === '' ? null : trimmed;
  });
