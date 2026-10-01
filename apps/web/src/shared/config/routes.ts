/** Every client route in one place, so links never hard-code paths. */
export const routes = {
  home: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  myWork: '/my-work',
  projects: '/projects',
  project: (id: string) => `/projects/${id}`,
  projectTasks: (id: string) => `/projects/${id}/tasks`,
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
  profile: '/profile',
} as const;

/** Routes reachable without a session. */
export const PUBLIC_ROUTES = [routes.login, routes.register];
