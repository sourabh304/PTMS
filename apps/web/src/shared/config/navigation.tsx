import { BarChart3, CheckSquare, Clock, FolderKanban, LayoutDashboard, Settings, type LucideIcon } from 'lucide-react';
import { Permission } from '@/shared/constants/domain';
import { routes } from './routes';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the user holds this permission. */
  permission?: Permission;
}

export const MAIN_NAVIGATION: NavItem[] = [
  { label: 'Dashboard', href: routes.dashboard, icon: LayoutDashboard },
  { label: 'My Work', href: routes.myWork, icon: CheckSquare },
  { label: 'Projects', href: routes.projects, icon: FolderKanban },
  { label: 'Timesheets', href: routes.timesheets, icon: Clock },
  { label: 'Reports', href: routes.reports, icon: BarChart3, permission: Permission.REPORTS_VIEW },
];

export const SECONDARY_NAVIGATION: NavItem[] = [
  { label: 'Settings', href: routes.settings, icon: Settings, permission: Permission.USERS_VIEW },
];
