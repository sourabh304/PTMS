/** Mirrors apps/api/src/features/custom-fields/custom-field.constants.ts. */
export const CUSTOM_FIELD_TYPES = [
  { value: 'TEXT', label: 'Text', description: 'Short free text' },
  { value: 'NUMBER', label: 'Numbers', description: 'Amounts, counts, scores; summed per group' },
  { value: 'DROPDOWN', label: 'Dropdown', description: 'Colored labels you define' },
  { value: 'CHECKBOX', label: 'Checkbox', description: 'Yes / no' },
  { value: 'DATE', label: 'Date', description: 'A calendar date' },
  { value: 'LINK', label: 'Link', description: 'A web address' },
  { value: 'TAGS', label: 'Tags', description: 'Free-form keywords' },
  { value: 'RATING', label: 'Rating', description: '0 to 5 stars' },
] as const;

export type CustomFieldType = (typeof CUSTOM_FIELD_TYPES)[number]['value'];

export const MAX_RATING = 5;

export interface CustomFieldOption {
  id: string;
  label: string;
  color: string;
}

export interface CustomField {
  id: string;
  projectId: string;
  name: string;
  type: CustomFieldType;
  options: CustomFieldOption[];
  position: number;
}

export interface CustomFieldInput {
  name: string;
  type?: CustomFieldType;
  options?: { id?: string; label: string; color: string }[];
  position?: number;
}

/** Decoded value of a task in a column (`undefined` when empty). */
export function readCustomValue(values: { fieldId: string; value: string }[] | undefined, fieldId: string): unknown {
  const raw = values?.find((v) => v.fieldId === fieldId)?.value;
  if (raw === undefined) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    return undefined;
  }
}
