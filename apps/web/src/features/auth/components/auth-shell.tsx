import { BarChart3, CalendarRange, CheckCircle2, Clock } from 'lucide-react';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { Wordmark } from '@/shared/components/wordmark';
import { ThemeToggle } from '@/shared/theme/theme-toggle';

const HIGHLIGHTS = [
  { icon: CheckCircle2, title: 'Tasks & boards', text: 'Task lists, subtasks and Kanban with your own workflow.' },
  { icon: CalendarRange, title: 'Timeline planning', text: 'Gantt charts with dependencies and milestones.' },
  { icon: Clock, title: 'Timesheets', text: 'Billable tracking with approval workflows.' },
  { icon: BarChart3, title: 'Insights', text: 'Portfolio health, workload and utilization reports.' },
];

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      <aside
        data-sidebar="dark"
        className="relative hidden flex-col justify-between overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-14"
      >
        {/* Subtle grid texture */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)',
            backgroundSize: '48px 48px',
            maskImage: 'radial-gradient(ellipse at top left, black 30%, transparent 75%)',
          }}
        />
        <div aria-hidden className="pointer-events-none absolute -right-40 -top-40 size-[28rem] rounded-full bg-brand opacity-20 blur-[120px]" />

        <Wordmark className="relative text-lg text-sidebar-heading" />

        <div className="relative max-w-md">
          <h2 className="text-3xl font-semibold leading-tight tracking-tight text-sidebar-heading xl:text-4xl">{appConfig.tagline}</h2>
          <ul className="mt-10 space-y-6">
            {HIGHLIGHTS.map(({ icon: Icon, title: itemTitle, text }) => (
              <li key={itemTitle} className="flex gap-4">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-ui border border-white/10 bg-white/5">
                  <Icon className="size-4 text-sidebar-heading" />
                </span>
                <span>
                  <span className="block text-sm font-medium text-sidebar-heading">{itemTitle}</span>
                  <span className="block text-sm text-sidebar-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>

        <p className="relative text-xs text-sidebar-muted">
          © {year} {appConfig.companyName}
        </p>
      </aside>

      <main className="flex flex-col">
        <div className="flex h-16 items-center justify-between px-6 sm:px-10">
          <Wordmark className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-16 sm:px-10">
          <div className="w-full max-w-[400px]">
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
      </main>
    </div>
  );
}
