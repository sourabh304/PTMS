import type { UserSummary } from '@/shared/types/api';

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
  /** Set when the root administrator soft deleted it. */
  deletedAt: string | null;
  admins: UserSummary[];
  userCount: number;
  projectCount: number;
}

export interface CreateWorkspaceInput {
  name: string;
  adminFirstName: string;
  adminLastName: string;
  adminEmail: string;
  adminPassword: string;
}
