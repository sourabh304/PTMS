import { ActivityAction, EntityType, NotificationType } from '../constants/domain.constants';

export const DomainEvent = {
  ACTIVITY_RECORDED: 'activity.recorded',
  NOTIFICATION_REQUESTED: 'notification.requested',
} as const;

export interface ActivityRecordedEvent {
  organizationId: string;
  projectId?: string | null;
  actorId: string;
  entityType: EntityType;
  entityId: string;
  action: ActivityAction;
  summary: string;
  metadata?: Record<string, unknown>;
}

export interface NotificationRequestedEvent {
  recipientIds: string[];
  actorId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
}

/** Client-side routes notifications deep-link to. */
export const NotificationLinks = {
  project: (projectId: string) => `/projects/${projectId}`,
  task: (projectId: string, taskId: string) => `/projects/${projectId}/tasks?taskId=${taskId}`,
  issue: (projectId: string, issueId: string) => `/projects/${projectId}/issues?issueId=${issueId}`,
  timesheet: () => `/timesheets`,
  projectTimesheet: (projectId: string) => `/projects/${projectId}/timesheets`,
};
