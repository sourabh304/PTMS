import { BarChart3, CalendarRange, CheckCircle2, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { BrandLogo } from '@/shared/components/brand-logo';

const HIGHLIGHTS = [
  { icon: CheckCircle2, text: 'Tasks, boards and subtasks with custom workflows', tint: 'bg-sky-300' },
  { icon: CalendarRange, text: 'Gantt charts with dependencies and milestones', tint: 'bg-violet-300' },
  { icon: Clock, text: 'Timesheets with approvals and billable tracking', tint: 'bg-amber-300' },
  { icon: BarChart3, text: 'Dashboards, workload and portfolio health reports', tint: 'bg-emerald-300' },
];

const CLAY_ICON =
  'shadow-[5px_6px_12px_rgb(150_122_84/0.28),inset_2px_2px_4px_rgb(255_251_242/0.6),inset_-2px_-3px_6px_rgb(0_0_0/0.12)]';

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="grid min-h-screen gap-6 p-4 sm:p-6 lg:grid-cols-2">
      <aside className="clay relative hidden overflow-hidden rounded-[36px] p-12 lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-orange-200 opacity-50 blur-3xl" />
        <div className="absolute -bottom-24 -left-16 h-80 w-80 rounded-full bg-amber-300 opacity-30 blur-3xl" />
        <BrandLogo size="lg" compact className="relative" />
        <div className="relative max-w-md">
          <h2 className="text-3xl font-extrabold leading-tight tracking-tight">{appConfig.tagline}</h2>
          <ul className="mt-8 space-y-4">
            {HIGHLIGHTS.map(({ icon: Icon, text, tint }) => (
              <li key={text} className="clay-sm flex items-center gap-4 rounded-2xl p-3 text-sm font-semibold text-foreground/80">
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white ${tint} ${CLAY_ICON}`}>
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-xs font-medium text-muted">
          © {year} {appConfig.companyName}
        </p>
      </aside>
      <main className="flex items-center justify-center p-2 sm:p-6">
        <div className="clay w-full max-w-md rounded-[32px] p-8 sm:p-10">
          <BrandLogo compact className="mb-8 lg:hidden" />
          <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
