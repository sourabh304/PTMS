import { CalendarRange, CheckCircle2, Users, type LucideIcon } from 'lucide-react';

/** Marketing content of the sign-in page; edit here to change what visitors see. */
export const AUTH_SHOWCASE: {
  highlights: { icon: LucideIcon; label: string }[];
  preview: { title: string; rows: { name: string; tag: string; progress: number; note: string; due: string; color: string }[] };
} = {
  highlights: [
    { icon: CalendarRange, label: 'Gantt timelines & dependencies' },
    { icon: CheckCircle2, label: 'Timesheet approvals' },
    { icon: Users, label: 'Team workload & utilization' },
  ],
  /** Illustrative product preview (not live data). */
  preview: {
    title: 'portfolio-overview',
    rows: [
      { name: 'ERP Data Migration', tag: 'Planning', progress: 32, note: 'Data mapping in review', due: 'Due in 4 days', color: '#3e63dd' },
      { name: 'Field Service Mobile App', tag: 'QA', progress: 64, note: 'Sprint 14 · in review', due: 'Due Sep 28', color: '#30a46c' },
      { name: 'Corporate Website Revamp', tag: 'Design', progress: 45, note: 'Design tokens synced', due: 'Due Oct 12', color: '#8e4ec6' },
    ],
  },
};
