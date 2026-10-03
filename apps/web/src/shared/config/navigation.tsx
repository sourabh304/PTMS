import { BarChart3, Building2, CheckSquare, Clock, CreditCard, FolderKanban, LayoutDashboard, Package, Settings, type LucideIcon } from 'lucide-react';
import { Permission } from '@/shared/constants/domain';
import { routes } from './routes';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the user holds this permission. */
  permission?: Permission;
  /** Counter shown as a badge (key of the nav-counts API response). */
  badge?: 'myOpenTasks' | 'projects';
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

export const NAVIGATION: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard', href: routes.dashboard, icon: LayoutDashboard },
      { label: 'My Work', href: routes.myWork, icon: CheckSquare, badge: 'myOpenTasks' },
      { label: 'Projects', href: routes.projects, icon: FolderKanban, badge: 'projects' },
      { label: 'Timesheets', href: routes.timesheets, icon: Clock },
    ],
  },
  {
    label: 'Insights',
    items: [{ label: 'Reports', href: routes.reports, icon: BarChart3, permission: Permission.REPORTS_VIEW }],
  },
  {
    label: 'Administration',
    items: [{ label: 'Settings', href: routes.settings, icon: Settings }],
  },
];

/** Navigation of the platform console (root account only). */
export const PLATFORM_NAVIGATION: NavSection[] = [
  {
    label: 'Platform',
    items: [
      { label: 'Overview', href: routes.platform, icon: LayoutDashboard },
      { label: 'Organizations', href: routes.platformOrganizations, icon: Building2 },
      { label: 'Plans', href: routes.platformPlans, icon: Package },
      { label: 'Subscriptions', href: routes.platformSubscriptions, icon: CreditCard },
    ],
  },
];

/** Settings sub-pages; Appearance is personal and available to everyone. */
export const SETTINGS_NAVIGATION: (Omit<NavItem, 'icon'> & { description: string })[] = [
  { label: 'Appearance', href: routes.settingsAppearance, description: 'Theme, colors and fonts' },
  { label: 'Organization', href: routes.settingsOrganization, description: 'Name, brand color and working time', permission: Permission.USERS_VIEW },
  { label: 'Users', href: routes.settingsUsers, description: 'People and access', permission: Permission.USERS_VIEW },
  { label: 'Workflow', href: routes.settingsWorkflow, description: 'Statuses, priorities and severities', permission: Permission.USERS_VIEW },
];
