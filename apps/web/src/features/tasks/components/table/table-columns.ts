/**
 * Columns of the project table, in display order. Header, rows and the group summary
 * all derive their grid from this list, so a column is added or resized in one place.
 */
export const TABLE_COLUMNS = [
  { id: 'people', label: 'Owner', width: 120 },
  { id: 'status', label: 'Status', width: 150 },
  { id: 'priority', label: 'Priority', width: 130 },
  { id: 'timeline', label: 'Timeline', width: 170 },
  { id: 'estimate', label: 'Estimate', width: 100 },
  { id: 'progress', label: 'Progress', width: 120 },
] as const;

/** Width of the task (first) column; it absorbs any extra space. */
const TASK_COLUMN_MIN = 260;
/** Colored group strip at the start of every row. */
export const GROUP_STRIP_WIDTH = 6;

export const TABLE_GRID = `${GROUP_STRIP_WIDTH}px minmax(${TASK_COLUMN_MIN}px, 1fr) ${TABLE_COLUMNS.map((c) => `${c.width}px`).join(' ')}`;
export const TABLE_MIN_WIDTH = GROUP_STRIP_WIDTH + TASK_COLUMN_MIN + TABLE_COLUMNS.reduce((sum, c) => sum + c.width, 0);
