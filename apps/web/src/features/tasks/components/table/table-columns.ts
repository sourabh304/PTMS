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

/** Width of each custom column, and of the trailing "+" column that adds one. */
export const CUSTOM_COLUMN_WIDTH = 150;
export const ADD_COLUMN_WIDTH = 44;

export interface TableLayout {
  grid: string;
  minWidth: number;
  customCount: number;
  /** Whether the trailing "+ add column" cell is shown. */
  addColumn: boolean;
}

/** Grid of the built-in columns followed by the project's custom columns. */
export function tableLayout(customCount = 0, addColumn = false): TableLayout {
  const widths = [...TABLE_COLUMNS.map((c) => c.width), ...Array<number>(customCount).fill(CUSTOM_COLUMN_WIDTH), ...(addColumn ? [ADD_COLUMN_WIDTH] : [])];
  return {
    grid: `${GROUP_STRIP_WIDTH}px minmax(${TASK_COLUMN_MIN}px, 1fr) ${widths.map((w) => `${w}px`).join(' ')}`,
    minWidth: GROUP_STRIP_WIDTH + TASK_COLUMN_MIN + widths.reduce((sum, w) => sum + w, 0),
    customCount,
    addColumn,
  };
}
