import type { MeetingType } from '@/shared/constants/domain';
import type { UserSummary } from '@/shared/types/api';

export interface Meeting {
  id: string;
  projectId: string | null;
  title: string;
  description: string | null;
  type: MeetingType;
  link: string;
  startsAt: string;
  endsAt: string;
  project: { id: string; name: string; key: string; color: string | null } | null;
  createdBy: UserSummary;
  updatedAt: string;
}

export interface MeetingInput {
  title: string;
  description?: string | null;
  type: MeetingType;
  link: string;
  startsAt: string;
  endsAt: string;
  projectId?: string | null;
}
