/**
 * Colors offered when recoloring a group. Mirrors the palette the API assigns to new
 * groups (apps/api/src/features/task-lists/task-list.colors.ts).
 */
export const GROUP_COLORS = ['#579bfc', '#a25ddc', '#00c875', '#fdab3d', '#e2445c', '#037f4c', '#ff642e', '#9cd326', '#784bd1', '#66ccff'] as const;

/** Color for groups saved before group colors existed, and for tasks without a group. */
export const FALLBACK_GROUP_COLOR = '#a6a6a6';
