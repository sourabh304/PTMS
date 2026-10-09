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
    <div className="clay flex h-full flex-col rounded-[28px] text-sidebar-foreground">
      <div className="flex h-20 items-center px-5">
        <Link href={routes.dashboard}>
          <BrandLogo name={user.organization.name} logoUrl={user.organization.logoUrl} />
        </Link>
      </div>
      <nav className="scrollbar-thin flex-1 space-y-1.5 overflow-y-auto px-3 py-4">
        {visible(MAIN_NAVIGATION).map((item) => (
          <SidebarLink key={item.href} item={item} active={pathname === item.href || pathname.startsWith(`${item.href}/`)} />
        ))}
      </nav>
      <div className="space-y-1.5 border-t border-border/70 px-3 py-4">
        {visible(SECONDARY_NAVIGATION).map((item) => (
          <SidebarLink key={item.href} item={item} active={pathname.startsWith(item.href)} />
        ))}
        <p className="px-3 pt-3 text-[11px] font-medium text-muted">{appConfig.name}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen">
      <BrandingStyles color={user.organization.primaryColor} />
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 p-4 lg:block">{sidebar}</aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-[#3b2f1e]/25 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="relative h-full w-72 p-3">{sidebar}</aside>
        </div>
      )}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 px-4 pt-4 sm:px-6 lg:px-8">
          <div className="clay flex h-16 items-center justify-between gap-4 rounded-3xl px-4 backdrop-blur sm:px-5">
          <button
            type="button"
            className="clay-sm rounded-xl p-2 text-muted lg:hidden"
            onClick={() => setMobileOpen((open) => !open)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
          <div className="hidden text-sm font-bold text-foreground lg:block">{user.organization.name}</div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <UserMenu />
          </div>
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
        'flex items-center gap-3 rounded-2xl px-3.5 py-2.5 text-sm font-semibold transition',
        active ? 'bg-brand text-brand-foreground shadow-clay-brand' : 'text-sidebar-foreground hover:bg-surface-muted hover:text-foreground hover:shadow-clay-inset',
      )}
    >
      <Icon className="h-4.5 w-4.5" />
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
        <button type="button" onClick={toggle} className="clay-sm flex items-center gap-2 rounded-2xl p-1 pr-3 transition hover:-translate-y-px">
          <Avatar user={user} />
          <span className="hidden text-left sm:block">
            <span className="block text-sm font-bold leading-tight">{fullName(user)}</span>
            <span className="block text-[11px] leading-tight text-muted">{user.isRootAdmin ? 'Root admin' : humanize(user.role)}</span>
          </span>
        </button>
      )}
    >
      {(close) => (
        <>
          <div className="mb-1 border-b border-border/70 px-3 py-2">
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
