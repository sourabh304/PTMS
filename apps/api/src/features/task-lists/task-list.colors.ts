/** Palette new groups cycle through; any group color can be changed afterwards. */
export const GROUP_COLORS = ['#579bfc', '#a25ddc', '#00c875', '#fdab3d', '#e2445c', '#037f4c', '#ff642e', '#9cd326', '#784bd1', '#66ccff'] as const;

export const nextGroupColor = (existingGroups: number): string => GROUP_COLORS[existingGroups % GROUP_COLORS.length];
