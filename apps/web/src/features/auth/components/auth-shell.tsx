import { BarChart3, CalendarRange, CheckCircle2, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { BrandLogo } from '@/shared/components/brand-logo';

const HIGHLIGHTS = [
  { icon: CheckCircle2, text: 'Tasks, boards and subtasks with custom workflows' },
  { icon: CalendarRange, text: 'Gantt charts with dependencies and milestones' },
  { icon: Clock, text: 'Timesheets with approvals and billable tracking' },
  { icon: BarChart3, text: 'Dashboards, workload and portfolio health reports' },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden bg-sidebar p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-brand opacity-30 blur-3xl" />
        <div className="absolute -bottom-32 -left-16 h-96 w-96 rounded-full bg-brand opacity-20 blur-3xl" />
        <BrandLogo inverted className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight">{appConfig.tagline}</h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 text-sm text-slate-300">
                <Icon className="h-5 w-5 text-brand" />
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs text-slate-500">
          © {year} {appConfig.companyName}
        </p>
      </aside>
      <main className="flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <BrandLogo className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
