'use client';

import { useCallback, useEffect, useState } from 'react';

/** Per-browser display preferences of a project's main table. */
export interface TableViewState {
  /** Built-in column ids and custom field ids that are hidden. */
  hiddenColumns: string[];
  /** Show the distribution/total row under each group. */
  showSummary: boolean;
  /** Group ids (or "ungrouped") that are folded. */
  collapsedGroups: string[];
}

const DEFAULT_VIEW: TableViewState = { hiddenColumns: [], showSummary: false, collapsedGroups: [] };
const storageKey = (projectId: string) => `ui.table-view.${projectId}`;

/** Table view preferences, remembered per project in this browser (falls back to defaults). */
export function useTableView(projectId: string) {
  const [view, setView] = useState<TableViewState>(DEFAULT_VIEW);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey(projectId));
      setView(saved ? { ...DEFAULT_VIEW, ...(JSON.parse(saved) as Partial<TableViewState>) } : DEFAULT_VIEW);
    } catch {
      setView(DEFAULT_VIEW);
    }
  }, [projectId]);

  const update = useCallback(
    (patch: (current: TableViewState) => Partial<TableViewState>) =>
      setView((current) => {
        const next = { ...current, ...patch(current) };
        try {
          window.localStorage.setItem(storageKey(projectId), JSON.stringify(next));
        } catch {
          // Storage blocked: the preference still applies for this visit.
        }
        return next;
      }),
    [projectId],
  );

  const toggleIn = (list: string[], id: string) => (list.includes(id) ? list.filter((value) => value !== id) : [...list, id]);

  return {
    view,
    toggleColumn: (id: string) => update((v) => ({ hiddenColumns: toggleIn(v.hiddenColumns, id) })),
    showAllColumns: () => update(() => ({ hiddenColumns: [] })),
    setShowSummary: (showSummary: boolean) => update(() => ({ showSummary })),
    toggleGroup: (id: string) => update((v) => ({ collapsedGroups: toggleIn(v.collapsedGroups, id) })),
    setCollapsedGroups: (collapsedGroups: string[]) => update(() => ({ collapsedGroups })),
  };
}
