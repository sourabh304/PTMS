'use client';

import { ChevronsUpDown, LogOut, Menu, Palette, PanelLeftClose, PanelLeftOpen, UserRound, X } from 'lucide-react';
import { useNavCounts } from '@/features/dashboard/api';
import { GlobalSearch } from '@/features/search/components/global-search';
import { appConfig } from '@/shared/config/env';
import { useSystemStatus } from '@/shared/hooks/use-system-status';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useLogout, useSession } from '@/features/auth/api';
import type { SessionUser } from '@/features/auth/types';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { NAVIGATION, type NavItem } from '@/shared/config/navigation';
import { routes } from '@/shared/config/routes';
import { cn, fullName, humanize } from '@/shared/lib/utils';
import { ThemeToggle } from '@/shared/theme/theme-toggle';
import { useNavCollapsed } from '@/shared/theme/use-nav-collapsed';
import { Avatar } from '@/shared/ui/avatar';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/shared/ui/dropdown';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { BrandingStyles } from './branding-styles';
import { Wordmark } from './wordmark';

const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError, refetch } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const nav = useNavCollapsed();

  useEffect(() => setMobileOpen(false), [pathname]);

  if (isLoading) return <Spinner className="min-h-screen" label="Loading your workspace" />;
  if (isError || !user) return <ErrorState message="We could not load your session." onRetry={() => refetch()} />;

  return (
    <div className="min-h-screen">
      <BrandingStyles color={user.organization.primaryColor} />

      <aside data-collapsible className="fixed inset-y-0 left-0 z-30 hidden w-[var(--sidebar-w)] transition-[width] duration-200 ease-out lg:block">
        <Sidebar user={user} pathname={pathname} collapsed={nav.collapsed} onToggleCollapse={nav.toggle} />
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 animate-fade-in bg-overlay" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 max-w-[85vw] animate-slide-in-left shadow-ui-lg">
            <Sidebar user={user} pathname={pathname} onClose={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <div className="transition-[padding] duration-200 ease-out lg:pl-[var(--sidebar-w)]">
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-border bg-surface/85 px-4 backdrop-blur-md supports-[backdrop-filter]:bg-surface/75 sm:px-6">
          <button
            type="button"
            className="-ml-1 flex size-9 items-center justify-center rounded-ui text-muted hover:bg-surface-muted hover:text-foreground lg:hidden"
            onClick={() => setMobileOpen(true)}
            aria-label="Open navigation"
          >
            <Menu className="size-5" />
          </button>
          <div className="flex min-w-0 flex-1 items-center">
            <GlobalSearch />
          </div>
          <div className="flex items-center gap-1">
            <ThemeToggle />
            <NotificationBell />
            <div className="mx-1.5 hidden h-6 w-px bg-border sm:block" />
            <UserMenu user={user} />
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

interface SidebarProps {
  user: SessionUser;
  pathname: string;
  /** Mobile drawer close handler. */
  onClose?: () => void;
  /** Desktop only: icon-rail mode. */
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}

function Sidebar({ user, pathname, onClose, collapsed, onToggleCollapse }: SidebarProps) {
  const { data: counts } = useNavCounts();
  const visible = (items: NavItem[]) => items.filter((item) => !item.permission || user.permissions.includes(item.permission));

  return (
    <div className="flex h-full flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4 collapsed:justify-center collapsed:px-0">
        <Link href={routes.dashboard} className="min-w-0 collapsed:hidden">
          <Wordmark className="block text-sidebar-heading" />
          <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-sidebar-muted">{user.organization.slug}</span>
        </Link>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={onToggleCollapse}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            aria-expanded={!collapsed}
            title={`${collapsed ? 'Expand' : 'Collapse'} sidebar (Ctrl+B)`}
            className="flex size-8 shrink-0 items-center justify-center rounded-ui text-sidebar-muted transition-colors hover:bg-sidebar-hover hover:text-sidebar-foreground"
          >
            <PanelLeftClose className="size-[18px] collapsed:hidden" />
            <PanelLeftOpen className="hidden size-[18px] collapsed:block" />
          </button>
        )}
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close navigation" className="rounded-ui p-1.5 text-sidebar-muted hover:bg-sidebar-hover">
            <X className="size-5" />
          </button>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-6 overflow-y-auto overflow-x-hidden px-3 py-4 collapsed:space-y-3">
        {NAVIGATION.map((section) => {
          const items = visible(section.items);
          if (!items.length) return null;
          return (
            <div key={section.label}>
              <p className="mb-1.5 truncate px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted collapsed:hidden">{section.label}</p>
              <div aria-hidden className="mx-auto mb-3 hidden h-px w-6 bg-sidebar-border collapsed:block [[data-sidebar=dark]_&]:bg-white/10" />
              <ul className="space-y-0.5">
                {items.map((item) => (
                  <li key={item.href}>
                    <SidebarLink item={item} active={isActive(pathname, item.href)} count={item.badge ? counts?.[item.badge] : undefined} />
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </nav>

      <div className="shrink-0 space-y-2 border-t border-sidebar-border p-3">
        <Link
          href={routes.settings}
          title={user.organization.name}
          className="flex items-center gap-2.5 rounded-ui border border-sidebar-border px-2.5 py-2 transition-colors hover:bg-sidebar-hover collapsed:justify-center collapsed:border-transparent collapsed:px-0"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-ui bg-sidebar-hover text-xs font-semibold uppercase text-sidebar-heading">
            {initialsOf(user.organization.name)}
          </span>
          <span className="min-w-0 flex-1 collapsed:hidden">
            <span className="block truncate text-sm font-medium text-sidebar-heading">{user.organization.name}</span>
            <span className="block truncate text-xs text-sidebar-muted">{humanize(user.role)} workspace</span>
          </span>
          <ChevronsUpDown className="size-3.5 shrink-0 text-sidebar-muted collapsed:hidden" />
        </Link>
        <SystemStatus />
      </div>
    </div>
  );
}

function initialsOf(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('');
}

function SystemStatus() {
  const { operational, checking } = useSystemStatus();
  const label = checking ? 'Checking…' : operational ? 'Operational' : 'Degraded';
  return (
    <div className="flex items-center justify-between px-1 text-[11px] text-sidebar-muted collapsed:justify-center" title={`API status: ${label}`}>
      <span className="inline-flex items-center gap-1.5">
        <span className={cn('size-1.5 rounded-full', checking ? 'bg-sidebar-muted' : operational ? 'bg-success' : 'bg-danger')} />
        <span className="font-mono collapsed:hidden">{label}</span>
      </span>
      {appConfig.version && <span className="font-mono collapsed:hidden">v{appConfig.version}</span>}
    </div>
  );
}

function SidebarLink({ item, active, count }: { item: NavItem; active: boolean; count?: number }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      aria-current={active ? 'page' : undefined}
      title={item.label}
      className={cn(
        'group flex items-center gap-3 rounded-ui px-3 py-2 text-sm font-medium transition-colors collapsed:justify-center collapsed:px-0',
        active ? 'bg-sidebar-active text-sidebar-active-foreground' : 'text-sidebar-foreground hover:bg-sidebar-hover',
      )}
    >
      <Icon className={cn('size-[18px] shrink-0', active ? 'text-sidebar-active-foreground' : 'text-sidebar-muted group-hover:text-sidebar-foreground')} />
      <span className="min-w-0 flex-1 truncate whitespace-nowrap collapsed:sr-only">{item.label}</span>
      {!!count && (
        <span
          className={cn(
            'min-w-5 rounded-full px-1.5 text-center text-[11px] font-semibold tabular-nums leading-5 collapsed:hidden',
            active ? 'bg-brand text-brand-foreground' : 'bg-sidebar-hover text-sidebar-muted',
          )}
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

function UserMenu({ user }: { user: SessionUser }) {
  const logout = useLogout();
  const router = useRouter();

  const signOut = () =>
    logout.mutate(undefined, {
      onSettled: () => {
        router.replace(routes.login);
        router.refresh();
      },
    });

  return (
    <Dropdown
      trigger={({ toggle }) => (
        <button type="button" onClick={toggle} className="flex items-center gap-2.5 rounded-ui p-1 transition-colors hover:bg-surface-muted sm:pr-2">
          <Avatar user={user} />
          <span className="hidden text-left sm:block">
            <span className="block max-w-40 truncate text-sm font-medium leading-tight">{fullName(user)}</span>
            <span className="block text-[11px] leading-tight text-muted">{humanize(user.role)}</span>
          </span>
          <ChevronsUpDown className="hidden size-3.5 text-muted sm:block" />
        </button>
      )}
    >
      {(close) => {
        const go = (href: string) => {
          close();
          router.push(href);
        };
        return (
          <>
            <div className="px-2.5 py-2">
              <p className="truncate text-sm font-medium">{fullName(user)}</p>
              <p className="truncate text-xs text-muted">{user.email}</p>
            </div>
            <DropdownSeparator />
            <DropdownItem onClick={() => go(routes.profile)}>
              <UserRound /> My profile
            </DropdownItem>
            <DropdownItem onClick={() => go(routes.settingsAppearance)}>
              <Palette /> Appearance
            </DropdownItem>
            <DropdownSeparator />
            <DropdownItem onClick={signOut} danger>
              <LogOut /> Sign out
            </DropdownItem>
          </>
        );
      }}
    </Dropdown>
  );
}
