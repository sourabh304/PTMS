import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';

/** Quiet, single-column frame shared by the sign-in and sign-up pages. */
export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="flex min-h-screen flex-col bg-surface">
      <header className="px-6 pt-6 sm:px-10 sm:pt-8">
        <span className="inline-flex items-center gap-2 text-sm font-medium tracking-tight">
          <span className="h-2 w-2 rounded-full bg-brand" aria-hidden />
          {appConfig.name}
        </span>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-4xl leading-tight tracking-tight text-foreground">{title}</h1>
          {subtitle && <p className="mt-2 text-sm text-muted">{subtitle}</p>}
          <div className="mt-10">{children}</div>
        </div>
      </main>

      <footer className="flex flex-col gap-1 px-6 pb-6 text-xs text-muted/80 sm:flex-row sm:justify-between sm:px-10 sm:pb-8">
        <span>
          © {year} {appConfig.companyName}
        </span>
        {appConfig.tagline && <span>{appConfig.tagline}</span>}
      </footer>
    </div>
  );
}
