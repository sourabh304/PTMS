/** Column types a project can add to its main table. */
export const CustomFieldType = {
  TEXT: 'TEXT',
  NUMBER: 'NUMBER',
  DROPDOWN: 'DROPDOWN',
  CHECKBOX: 'CHECKBOX',
  DATE: 'DATE',
  LINK: 'LINK',
  TAGS: 'TAGS',
  RATING: 'RATING',
} as const;
export type CustomFieldType = (typeof CustomFieldType)[keyof typeof CustomFieldType];

export const MAX_CUSTOM_FIELDS = 20;
export const MAX_DROPDOWN_OPTIONS = 30;
export const MAX_TEXT_LENGTH = 500;
export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;
export const MAX_RATING = 5;
