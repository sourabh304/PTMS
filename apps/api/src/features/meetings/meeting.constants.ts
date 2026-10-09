/** Kinds of meeting; the calendar colours each one differently. */
export const MeetingType = {
  INTERNAL: 'INTERNAL',
  CLIENT: 'CLIENT',
} as const;
export type MeetingType = (typeof MeetingType)[keyof typeof MeetingType];
export const MEETING_TYPES = Object.values(MeetingType);

export const MEETING_TYPE_LABELS: Record<MeetingType, string> = {
  [MeetingType.INTERNAL]: 'Internal meeting',
  [MeetingType.CLIENT]: 'Client meeting',
};

/** Longest range one calendar request may load. */
export const MAX_MEETING_RANGE_DAYS = 120;
