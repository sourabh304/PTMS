import { BarChart3, CalendarCheck, Clock, House, Settings, type LucideIcon } from 'lucide-react';
import { Permission } from '@/shared/constants/domain';
import { routes } from './routes';

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Hidden unless the user holds this permission. */
  permission?: Permission;
  /** Counter shown as a badge (key of the nav-counts API response). */
  badge?: 'myOpenTasks';
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Organization workspace; the project list is rendered below these links. */
export const NAVIGATION: NavSection[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Home', href: routes.home, icon: House },
      { label: 'My work', href: routes.myWork, icon: CalendarCheck, badge: 'myOpenTasks' },
      { label: 'Timesheets', href: routes.timesheets, icon: Clock },
      { label: 'Reports', href: routes.reports, icon: BarChart3, permission: Permission.REPORTS_VIEW },
    ],
  },
];

/** Pinned to the bottom of the workspace sidebar. */
export const FOOTER_NAVIGATION: NavItem[] = [{ label: 'Settings', href: routes.settings, icon: Settings }];

/** Settings sub-pages; Appearance is personal and available to everyone. */
export const SETTINGS_NAVIGATION: (Omit<NavItem, 'icon'> & { description: string })[] = [
  { label: 'Appearance', href: routes.settingsAppearance, description: 'Theme, colors and fonts' },
  { label: 'Organization', href: routes.settingsOrganization, description: 'Name, brand color and working time', permission: Permission.ORG_MANAGE },
  { label: 'Users', href: routes.settingsUsers, description: 'People and roles', permission: Permission.USERS_MANAGE },
  { label: 'Workflow', href: routes.settingsWorkflow, description: 'Statuses, priorities and severities', permission: Permission.LOOKUPS_MANAGE },
];
