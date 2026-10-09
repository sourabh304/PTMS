/** Every client route in one place, so links never hard-code paths. */
export const routes = {
  root: '/',
  login: '/login',
  home: '/home',
  myWork: '/my-work',
  projects: '/projects',
  /** The project's main table. */
  project: (id: string) => `/projects/${id}`,
  projectTask: (id: string, taskId: string) => `/projects/${id}?taskId=${taskId}`,
  projectOverview: (id: string) => `/projects/${id}/overview`,
  projectBoard: (id: string) => `/projects/${id}/board`,
  projectGantt: (id: string) => `/projects/${id}/gantt`,
  projectMilestones: (id: string) => `/projects/${id}/milestones`,
  projectIssues: (id: string) => `/projects/${id}/issues`,
  projectTimesheets: (id: string) => `/projects/${id}/timesheets`,
  projectActivity: (id: string) => `/projects/${id}/activity`,
  projectSettings: (id: string) => `/projects/${id}/settings`,
  timesheets: '/timesheets',
  reports: '/reports',
  settings: '/settings',
  settingsOrganization: '/settings/organization',
  settingsUsers: '/settings/users',
  settingsWorkflow: '/settings/workflow',
  settingsAppearance: '/settings/appearance',
  profile: '/profile',
  platform: '/platform',
  platformOrganizations: '/platform/organizations',
  platformPlans: '/platform/plans',
  platformSubscriptions: '/platform/subscriptions',
  platformProfile: '/platform/profile',
  platformAppearance: '/platform/appearance',
} as const;

/** Routes reachable without a session. */
export const PUBLIC_ROUTES = [routes.login];
