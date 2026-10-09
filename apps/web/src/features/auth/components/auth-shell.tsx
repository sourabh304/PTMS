import { Lock } from 'lucide-react';
import type { ReactNode } from 'react';
import { appConfig } from '@/shared/config/env';
import { BrandLogo } from '@/shared/components/brand-logo';
import { ThemeToggle } from '@/shared/theme/theme-toggle';
import { AUTH_SHOWCASE } from '../auth-showcase';
import { SystemStatusLine } from './system-status-line';

const LEGAL_LINKS = [
  { label: 'Privacy', href: appConfig.privacyUrl },
  { label: 'Terms', href: appConfig.termsUrl },
  { label: 'Security', href: appConfig.securityUrl },
].filter((link) => link.href);

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  const year = new Date().getFullYear();
  return (
    <div className="grid min-h-dvh lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
      {/* ─── Brand panel ─────────────────────────────────────── */}
      <aside data-sidebar="dark" className="on-dark relative hidden flex-col overflow-hidden bg-sidebar p-10 text-sidebar-foreground lg:flex xl:p-12">
        <div aria-hidden className="pointer-events-none absolute -left-32 -top-32 size-[30rem] rounded-full bg-brand opacity-[0.18] blur-[120px]" />
        <div aria-hidden className="pointer-events-none absolute -bottom-40 right-0 size-[24rem] rounded-full bg-brand opacity-[0.12] blur-[120px]" />

        <div className="relative">
          <BrandLogo className="text-sidebar-heading [&_img]:h-8" />
        </div>

        <div className="relative my-auto max-w-xl py-6">
          {appConfig.version && (
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 font-mono text-[10px] uppercase tracking-wider text-sidebar-foreground">
              <span className="size-1.5 rounded-full bg-brand" /> Version {appConfig.version}
            </span>
          )}
          <h2 className="mt-5 text-3xl font-semibold leading-[1.15] tracking-tight text-sidebar-heading xl:text-[2.6rem]">{appConfig.tagline}</h2>
          {appConfig.description && <p className="mt-4 max-w-lg text-[15px] leading-relaxed text-sidebar-muted">{appConfig.description}</p>}

          <ul className="mt-6 flex flex-wrap gap-2">
            {AUTH_SHOWCASE.highlights.map(({ icon: Icon, label }) => (
              <li key={label} className="inline-flex items-center gap-2 rounded-ui border border-white/10 bg-white/[0.04] px-3 py-1.5 text-xs text-sidebar-foreground">
                <Icon className="size-3.5 text-sidebar-heading" /> {label}
              </li>
            ))}
          </ul>

          <ProductPreview />
        </div>

        <footer className="relative flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-5 text-xs text-sidebar-muted">
          <span className="flex flex-wrap items-center gap-x-2">
            © {year} {appConfig.companyName}
            <span aria-hidden>·</span>
            <SystemStatusLine />
          </span>
          {LEGAL_LINKS.length > 0 && (
            <nav className="flex gap-5">
              {LEGAL_LINKS.map((link) => (
                <a key={link.label} href={link.href} target="_blank" rel="noreferrer" className="transition-colors hover:text-sidebar-heading">
                  {link.label}
                </a>
              ))}
            </nav>
          )}
        </footer>
      </aside>

      {/* ─── Form panel ──────────────────────────────────────── */}
      <main className="flex flex-col bg-surface">
        <div className="flex h-16 items-center justify-between px-6 sm:px-10">
          <BrandLogo className="lg:invisible" />
          <ThemeToggle />
        </div>
        <div className="flex flex-1 items-center justify-center px-6 pb-10 sm:px-10">
          <div className="w-full max-w-[400px] animate-pop-in">
            <h1 className="text-[1.75rem] font-semibold tracking-tight">{title}</h1>
            {subtitle && <p className="mt-1.5 text-sm text-muted">{subtitle}</p>}
            <div className="mt-8">{children}</div>
          </div>
        </div>
        <p className="px-6 pb-6 text-center text-xs text-muted">
          <Lock className="mr-1.5 inline size-3.5 align-[-2px]" />
          Encrypted sessions and hashed passwords protect your workspace.
        </p>
      </main>
    </div>
  );
}

/** Illustrative "window" showing what the product looks like. */
function ProductPreview() {
  const { title, rows } = AUTH_SHOWCASE.preview;
  return (
    <div aria-hidden className="relative mt-8 rounded-ui-lg border border-white/10 bg-white/[0.03] shadow-2xl shadow-black/40">
      <div className="flex items-center gap-2 border-b border-white/10 px-4 py-3">
        <span className="size-2.5 rounded-full bg-[#ff5f57]" />
        <span className="size-2.5 rounded-full bg-[#febc2e]" />
        <span className="size-2.5 rounded-full bg-[#28c840]" />
        <span className="ml-2 font-mono text-[11px] text-sidebar-muted">{title}</span>
      </div>
      <ul className="space-y-2.5 p-3">
        {rows.map((row) => (
          <li key={row.name} className="rounded-ui border border-white/[0.06] bg-white/[0.03] px-4 py-3">
            <div className="flex items-center justify-between gap-3">
              <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-sidebar-heading">
                <span className="size-2 shrink-0 rounded-full" style={{ backgroundColor: row.color }} />
                <span className="truncate">{row.name}</span>
                <span className="shrink-0 rounded px-1.5 py-0.5 font-mono text-[9px] uppercase tracking-wider" style={{ backgroundColor: `${row.color}26`, color: row.color }}>
                  {row.tag}
                </span>
              </span>
              <span className="shrink-0 font-mono text-[11px] text-sidebar-muted">{row.progress}% completed</span>
            </div>
            <div className="mt-2.5 h-1 overflow-hidden rounded-full bg-white/[0.08]">
              <div className="h-full rounded-full" style={{ width: `${row.progress}%`, backgroundColor: row.color }} />
            </div>
            <div className="mt-2 flex justify-between font-mono text-[10px] text-sidebar-muted">
              <span>{row.note}</span>
              <span>{row.due}</span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
