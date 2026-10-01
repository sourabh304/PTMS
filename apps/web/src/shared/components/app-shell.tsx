'use client';

import { LogOut, Menu, UserRound, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { useLogout, useSession } from '@/features/auth/api';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { appConfig } from '@/shared/config/env';
import { MAIN_NAVIGATION, SECONDARY_NAVIGATION, type NavItem } from '@/shared/config/navigation';
import { routes } from '@/shared/config/routes';
import { cn, fullName, humanize } from '@/shared/lib/utils';
import { Avatar } from '@/shared/ui/avatar';
import { Dropdown, DropdownItem } from '@/shared/ui/dropdown';
import { ErrorState, Spinner } from '@/shared/ui/feedback';
import { BrandLogo } from './brand-logo';
import { BrandingStyles } from './branding-styles';

export function AppShell({ children }: { children: ReactNode }) {
  const { data: user, isLoading, isError, refetch } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => setMobileOpen(false), [pathname]);

  if (isLoading) return <Spinner className="min-h-screen" label="Loading your workspace" />;
  if (isError || !user) return <ErrorState message="We could not load your session." onRetry={() => refetch()} />;

  const visible = (items: NavItem[]) => items.filter((item) => !item.permission || user.permissions.includes(item.permission));

  const sidebar = (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      <div className="flex h-16 items-center px-5">
        <Link href={routes.dashboard}>
          <BrandLogo inverted name={user.organization.name} logoUrl={user.organization.logoUrl} />
        </Link>
      </div>
      <nav className="flex-1 space-y-1 px-3 py-4">
        {visible(MAIN_NAVIGATION).map((item) => (
          <SidebarLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
      </nav>
      <div className="space-y-1 border-t border-white/10 px-3 py-4">
        {visible(SECONDARY_NAVIGATION).map((item) => (
          <SidebarLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
        <p className="px-3 pt-3 text-[11px] text-slate-500">{appConfig.name}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <BrandingStyles color={user.organization.primaryColor} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-64">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-60">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-border bg-surface/90 px-4 backdrop-blur sm:px-6">
          <button
            type="button"
            className="rounded-lg p-2 text-muted hover:bg-surface-muted lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden text-sm text-muted lg:block">{user.organization.name}</div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
        </header>
        <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}

function SidebarLink({ item, active }: { item: NavItem; active: boolean }) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition',
        active ? 'bg-white/10 text-white' : 'text-sidebar-foreground hover:bg-white/5 hover:text-white',
      )}
    >
      <Icon className={cn('h-4.5 w-4.5', active && 'text-brand')} />
      {item.label}
    </Link>
  );
}

function UserMenu() {
  const { data: user } = useSession();
  const logout = useLogout();
  const router = useRouter();
  if (!user) return null;

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
        <button type="button" onClick={toggle} className="flex items-center gap-2 rounded-lg p-1 pr-2 hover:bg-surface-muted">
          <Avatar user={user} />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-medium leading-tight">{fullName(user)}</span>
            <span className="block text-[11px] leading-tight text-muted">{humanize(user.role)}</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium">{fullName(user)}</p>
            <p className="truncate text-xs text-muted">{user.email}</p>
          </div>
          <DropdownItem
            onClick={() => {
              close();
              router.push(routes.profile);
            }}
          >
            <UserRound className="h-4 w-4" /> My profile
          </DropdownItem>
          <DropdownItem onClick={signOut} danger>
            <LogOut className="h-4 w-4" /> Sign out
          </DropdownItem>
        </>
      )}
    </Dropdown>
  );
}
